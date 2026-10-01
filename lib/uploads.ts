import { supabase } from './supabase';
import { compressImage } from './imageUtils';

export interface UploadedImage {
  url: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export const getImageSize = (blob: Blob): Promise<{ width: number; height: number }> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });

const requestUploadUrl = async (fileName: string, contentType: string) => {
  const { data, error } = await supabase.functions.invoke('r2-upload', {
    body: { fileName, contentType },
  });
  if (error) throw new Error(`Falha ao preparar o upload: ${error.message}`);
  if (!data || !data.uploadUrl) throw new Error('Upload não autorizado.');
  return data as { key: string; uploadUrl: string; publicUrl: string };
};

// Central: imagens são comprimidas; vídeos passam direto com validação de
// tamanho. Sempre envia Content-Type no PUT para o R2 gravar o mime correto.
export const uploadMedia = async (file: File, preferredName?: string): Promise<UploadedImage> => {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) {
    throw new Error('Somente imagens e vídeos são permitidos.');
  }

  let payload: File = file;
  if (isImage) {
    payload = (await compressImage(file)) as File;
    if (payload.size > MAX_IMAGE_BYTES) {
      throw new Error('Imagem muito grande após a compressão (máx. 8 MB).');
    }
  } else if (file.size > MAX_VIDEO_BYTES) {
    throw new Error('Vídeo muito grande (máx. 100 MB).');
  }

  const name = preferredName || payload.name || (isVideo ? `video_${Date.now()}.mp4` : `imagem_${Date.now()}.jpg`);
  const contentType = isVideo
    ? payload.type || 'video/mp4'
    : payload.type || 'image/jpeg';

  const { uploadUrl, publicUrl } = await requestUploadUrl(name, contentType);

  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
    body: payload,
  });
  if (!putResponse.ok) {
    throw new Error(`Falha ao enviar mídia (código ${putResponse.status}).`);
  }

  const size = isImage ? await getImageSize(payload) : null;

  return {
    url: publicUrl,
    size_bytes: payload.size,
    width: size?.width ?? null,
    height: size?.height ?? null,
  };
};

export const uploadPostImage = async (file: File, preferredName?: string): Promise<UploadedImage> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Somente imagens são permitidas (sem vídeos).');
  }
  return uploadMedia(file, preferredName);
};

export const uploadPostImages = async (files: File[]): Promise<UploadedImage[]> => {
  const results: UploadedImage[] = [];
  for (const file of files) {
    results.push(await uploadPostImage(file));
  }
  return results;
};

// Apaga um objeto do R2 via edge function (DELETE só é aceito para arquivos do
// próprio usuário). Extrai a chave do pathname da URL pública indiferente do host.
export const deleteMedia = async (publicUrlOrKey: string): Promise<void> => {
  const trimmed = String(publicUrlOrKey || '').trim();
  if (!trimmed) return;
  const isUrl = /^https?:\/\//i.test(trimmed);
  const key = isUrl ? new URL(trimmed).pathname.replace(/^\//, '') : trimmed;
  if (!key) return;

  const { error } = await supabase.functions.invoke('r2-upload', {
    method: 'DELETE',
    body: { key },
  });
  if (error) {
    throw new Error(`Falha ao remover arquivo: ${error.message}`);
  }
};