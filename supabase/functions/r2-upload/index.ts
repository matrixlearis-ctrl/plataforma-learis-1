// SAMEJ SOCIAL — Fase 4.1 · Upload seguro de imagens e vídeos para Cloudflare R2
// POST  → devolve presigned PUT (upload direto do navegador).
// DELETE → apaga um objeto (server-side, limitado aos arquivos do PRÓPRIO usuário).
// O banco (política posts_insert + enforce_post_media_rules) continua sendo a
// autoridade de publicação: esta função só ministra/revoga acesso ao objeto.
//
// Variáveis de ambiente obrigatórias (Supabase secrets / CLI):
//   R2_ACCOUNT_ID            e.g. 1a2b3c4d5e6f7g8h9i0j
//   R2_ACCESS_KEY_ID         Access Key da R2 API token
//   R2_SECRET_ACCESS_KEY     Secret da R2 API token
//   R2_BUCKET                nome do bucket
//   R2_PUBLIC_URL            base pública (ex.: https://media-staging.samej.site) — opcional
//
// Deploy: supabase functions deploy r2-upload --project-ref <STAGING>

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
};

const encoder = new TextEncoder();
const utf8 = (s: string): Uint8Array => encoder.encode(s);
const toHex = (bytes: Uint8Array): string =>
  [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

// Converte string/Uint8Array em ArrayBuffer utilizável pelo Web Crypto (BufferSource).
const toBuffer = (data: Uint8Array | string): ArrayBuffer => {
  const bytes = typeof data === 'string' ? utf8(data) : data;
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
};

const sha256Hex = async (data: Uint8Array | string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', toBuffer(data));
  return toHex(new Uint8Array(digest));
};

const hmac = async (key: Uint8Array | string, data: Uint8Array | string): Promise<Uint8Array> => {
  const cryptoKey = await crypto.subtle.importKey('raw', toBuffer(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, toBuffer(data)));
};

const hmacHex = async (key: Uint8Array | string, data: string): Promise<string> =>
  toHex(await hmac(key, data));

const uriEncode = (s: string): string =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) =>
    '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Identifica o usuário autenticado pelo JWT (validação feita pelo gateway).
const getUserId = (req: Request): string | null => {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (payload?.sub && typeof payload.sub === 'string') return payload.sub;
    return null;
  } catch {
    return null;
  }
};

// Gera presigned URL (AWS SigV4) para PUT/DELETE de uma chave do bucket.
// Host já é virtual-hosted (<bucket>.<account>.r2.cloudflarestorage.com):
// o caminho assinado deve ser somente a chave (sem repetir o bucket).
const signUrl = async (opts: {
  method: string;
  accountId: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  key: string;
}): Promise<string> => {
  const { method, accountId, accessKey, secretKey, bucket, key } = opts;
  const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`;
  const region = 'auto';
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalUri = `/${key.split('/').map(uriEncode).join('/')}`;
  const query: [string, string][] = [
    ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', `${accessKey}/${scope}`],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', '3600'],
    ['X-Amz-SignedHeaders', 'host'],
    ['X-Amz-Content-Sha256', payloadHash],
  ];
  query.sort((a, b) => (a[0] < b[0] ? -1 : 1));

  const canonicalQuery = query.map(([k, v]) => `${uriEncode(k)}=${uriEncode(v)}`).join('&');
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    `host:${host}\n`,
    'host',
    payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = await hmac('AWS4' + secretKey, dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, 's3');
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = await hmacHex(kSigning, stringToSign);

  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return json({ error: 'Método não permitido.' }, 405);
  }

  const accountId = Deno.env.get('R2_ACCOUNT_ID');
  const accessKey = Deno.env.get('R2_ACCESS_KEY_ID');
  const secretKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
  const bucket = Deno.env.get('R2_BUCKET');
  const publicBase = Deno.env.get('R2_PUBLIC_URL');

  if (!accountId || !accessKey || !secretKey || !bucket) {
    return json({ error: 'R2 não configurado no projeto (secrets).' }, 500);
  }

  const userId = getUserId(req);
  if (!userId) {
    return json({ error: 'Não autenticado.' }, 401);
  }

  let body: { fileName?: string; contentType?: string; key?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Body inválido.' }, 400);
  }

  if (req.method === 'DELETE') {
    const key = String(body.key || '');
    // Bloqueia path traversal e garante que o usuário só apague os PRÓPRIOS arquivos
    // (a chave começa com <userId>/). Não aceita chaves de usuários já deletados.
    if (!key.startsWith(`${userId}/`) || key.indexOf('..') !== -1 || key.length > 512) {
      return json({ error: 'Chave inválida (apenas arquivos do próprio usuário).' }, 403);
    }
    const deleteUrl = await signUrl({ method: 'DELETE', accountId, accessKey, secretKey, bucket, key });
    const res = await fetch(deleteUrl, { method: 'DELETE' });
    return json({ ok: res.ok, status: res.status, key }, res.ok ? 200 : 502);
  }

  const fileName = String(body.fileName || 'imagem.jpg').replace(/[^\w.\-]/g, '_');
  const contentType = String(body.contentType || 'image/jpeg');
  const isImage = contentType.startsWith('image/');
  const isVideo = contentType.startsWith('video/');
  if (!isImage && !isVideo) {
    return json({ error: 'Somente imagens e vídeos são suportados.' }, 400);
  }

  const key = `${userId}/${Date.now()}_${fileName}`;
  const uploadUrl = await signUrl({ method: 'PUT', accountId, accessKey, secretKey, bucket, key });
  const publicUrl = publicBase ? `${publicBase.replace(/\/$/, '')}/${key}` : uploadUrl;

  return json({ key, uploadUrl, publicUrl, expiresIn: 3600 }, 200);
});