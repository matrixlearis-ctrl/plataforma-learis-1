# SAMEJ SOCIAL — Staging Test Runner V2.1 (FASE 3.2)
# Executa as suítes em supabase/migrations/tests contra o STAGING.
# Pré-requisitos: psql instalado; conexão admin (superuser) ao banco STAGING.
#   .\scripts\run_staging_tests.ps1 -DbUrl "postgresql://postgres.<ref>:<pwd>@aws-0-<reg>.pooler.supabase.com:5432/postgres"
# Saída: console + docs/RUN_RESULTS_YYYYMMDD_HHMMSS.{log,csv}
param(
  [Parameter(Mandatory=$true)][string]$DbUrl
)

$ErrorActionPreference = 'Stop'
$ts  = Get-Date -Format 'yyyyMMdd_HHmmss'
$out = "docs\RUN_RESULTS_$ts"
"#"+" SAMEJ SOCIAL STAGING TESTS — $ts" | Set-Content -Path "$out.csv" -Encoding UTF8
"sep=,"                                     | Add-Content -Path "$out.csv" -Encoding UTF8

function Invoke-Psql($Stmts, [switch]$File) {
  $prevEAP = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $tmp = $null
  try {
    if ($File) {
      $a = @('-v','ON_ERROR_STOP=1','-q','-X','-f',"$Stmts")
    } else {
      # PS 5.1 corrompe aspas duplas embutidas ao passar por linha de comando
      # (ex.: set_config json) -> grava o SQL em arquivo temporario e usa -f.
      $tmp = Join-Path $env:TEMP ("psql_stmt_{0:N}.sql" -f ([guid]::NewGuid()))
      $enc = New-Object System.Text.UTF8Encoding($false)
      [System.IO.File]::WriteAllText($tmp, $Stmts.ToString(), $enc)
      $a = @('-v','ON_ERROR_STOP=1','-q','-X','-f',$tmp)
    }
    $errFile = Join-Path $env:TEMP ("psql_out_{0:N}.txt" -f ([guid]::NewGuid()))
    & psql @a *> $errFile
    $code = $LASTEXITCODE
    $err  = if (Test-Path $errFile) { Get-Content -LiteralPath $errFile -Raw } else { '' }
    Remove-Item -LiteralPath $errFile -Force -ErrorAction SilentlyContinue
  } finally {
    if ($tmp) { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue }
  }
  $ErrorActionPreference = $prevEAP
  return [pscustomobject]@{ Code=$code; Err=$err }
}

$results = New-Object System.Collections.Generic.List[object]

function Add-Result($n, $name, $kind, $status, $details) {
  $row = [pscustomobject]@{ id=$n; name=$name; kind=$kind; status=$status; details=$details }
  $results.Add($row)
}

# ---------- PRECHECK: consegue SET ROLE anon/authenticated? ----------
$pre = $null
for ($i = 1; $i -le 4 -and $null -eq $pre; $i++) {
  $try = Invoke-Psql "SET ROLE anon; SELECT 1; RESET ROLE; SET ROLE authenticated; SELECT 1; RESET ROLE;"
  if ($try.Code -eq 0) { $pre = $try } else { Start-Sleep -Seconds 3 }
}
if ($null -eq $pre) {
  Write-Host "PRECHECK FAIL: nao foi possivel SET ROLE anon/authenticated ($($try.Err))."
  Write-Host " -> Todos os testes RLS serao NOT TESTABLE. Use o SQL Editor do staging (executa como postgres) para os blocos manuais."
} else {
  Write-Host "PRECHECK OK: SET ROLE anon/authenticated disponivel."
}

# ---------- TABELA DE ASSERTIONS RLS (uma sessao por teste) ----------
# Cada 'sql' DEVE terminar com um DO que RAISE se o acesso concedido for o ERRADO
# (para expect=deny: RAISE se linha/efeito aparecer; para expect=allow: RAISE se NAO aparecer).
$tests = @(
  @{ n=1;  name='01 anon lê plans (público)';                 expect='allow'; sql=@'
SET ROLE anon;
SELECT set_config('request.jwt.claims','{"role":"anon"}',true);
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM public.plans WHERE active) THEN RAISE EXCEPTION 'deny'; END IF; END $$;
'@ },
  @{ n=2;  name='02 anon NÃO lê profiles (PII)';              expect='deny';  sql=@'
SET ROLE anon;
SELECT set_config('request.jwt.claims','{"role":"anon"}',true);
DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.profiles) THEN RAISE EXCEPTION 'leak'; END IF; END $$;
'@ },
  @{ n=3;  name='03 user NÃO altera role';                    expect='deny';  sql=@'
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
DO $$ BEGIN
  UPDATE public.profiles SET role='ADMIN' WHERE id='11111111-1111-4111-8111-111111111111';
  IF FOUND THEN RAISE EXCEPTION '3 FAIL: conseguiu alterar role'; ELSE NULL; END IF;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ILIKE '%security%' OR SQLERRM ILIKE '%permission denied%' OR SQLERRM ILIKE '%policy%' THEN NULL;
    ELSE RAISE; END IF;
END $$;
'@ },
  @{ n=4;  name='04 user NÃO altera plan_id';                 expect='deny';  sql=@'
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
DO $$ BEGIN
  UPDATE public.profiles SET plan_id=(SELECT id FROM public.plans WHERE code='pro') WHERE id='11111111-1111-4111-8111-111111111111';
  IF FOUND THEN RAISE EXCEPTION '4 FAIL: conseguiu alterar plan_id'; ELSE NULL; END IF;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ILIKE '%security%' OR SQLERRM ILIKE '%permission denied%' OR SQLERRM ILIKE '%policy%' THEN NULL;
    ELSE RAISE; END IF;
END $$;
'@ },
  @{ n=5;  name='05 user NÃO altera credits';                 expect='deny';  sql=@'
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
DO $$ BEGIN
  UPDATE public.profiles SET credits=99999 WHERE id='11111111-1111-4111-8111-111111111111';
  IF FOUND THEN RAISE EXCEPTION '5 FAIL: conseguiu alterar credits'; ELSE NULL; END IF;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ILIKE '%security%' OR SQLERRM ILIKE '%permission denied%' OR SQLERRM ILIKE '%policy%' THEN NULL;
    ELSE RAISE; END IF;
END $$;
'@ },
  @{ n=6;  name='06 user NÃO altera verified';                expect='deny';  sql=@'
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
DO $$ BEGIN
  UPDATE public.profiles SET verified=true WHERE id='11111111-1111-4111-8111-111111111111';
  IF FOUND THEN RAISE EXCEPTION '6 FAIL: conseguiu alterar verified'; ELSE NULL; END IF;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ILIKE '%security%' OR SQLERRM ILIKE '%permission denied%' OR SQLERRM ILIKE '%policy%' THEN NULL;
    ELSE RAISE; END IF;
END $$;
'@ },
  @{ n=7;  name='07 user NÃO altera featured';                expect='deny';  sql=@'
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
DO $$ BEGIN
  UPDATE public.profiles SET featured=true WHERE id='11111111-1111-4111-8111-111111111111';
  IF FOUND THEN RAISE EXCEPTION '7 FAIL: conseguiu alterar featured'; ELSE NULL; END IF;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ILIKE '%security%' OR SQLERRM ILIKE '%permission denied%' OR SQLERRM ILIKE '%policy%' THEN NULL;
    ELSE RAISE; END IF;
END $$;
'@ },
  @{ n=8;  name='08 user NÃO altera account_status';          expect='deny';  sql=@'
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
DO $$ BEGIN
  UPDATE public.profiles SET account_status='blocked' WHERE id='11111111-1111-4111-8111-111111111111';
  IF FOUND THEN RAISE EXCEPTION '8 FAIL: conseguiu alterar account_status'; ELSE NULL; END IF;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ILIKE '%security%' OR SQLERRM ILIKE '%permission denied%' OR SQLERRM ILIKE '%policy%' THEN NULL;
    ELSE RAISE; END IF;
END $$;
'@ },
  @{ n=9;  name='09 OTHER NÃO lê dados do FREE';              expect='deny';  sql=@'
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.profiles WHERE id='11111111-1111-4111-8111-111111111111') THEN RAISE EXCEPTION 'leak'; END IF; END $$;
'@ },
  @{ n=10; name='10 user NÃO fabrica créditos (add_credits)'; expect='deny';  sql=@'
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
DO $$ BEGIN
  PERFORM public.add_credits('11111111-1111-4111-8111-111111111111',999);
  RAISE EXCEPTION '10 FAIL: conseguiu fabricar creditos';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ILIKE '%permission denied%' OR SQLERRM ILIKE '%security%' OR SQLERRM ILIKE '%policy%' THEN NULL;
    ELSE RAISE; END IF;
END $$;
'@ },
  @{ n=11; name='11 gastar sem saldo é bloqueado (backend)'; expect='allow'; sql=@'
DO $$ BEGIN
  BEGIN
    PERFORM public.spend_credits('11111111-1111-4111-8111-111111111111',100000,'lead_spend','x');
    RAISE EXCEPTION 'gastou sem saldo';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%saldo insuficiente%' THEN NULL; ELSE RAISE; END IF;
  END;
END $$;
'@ },
  @{ n=12; name='12 OTHER NÃO vê contatos do FREE';           expect='deny';  sql=@'
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.profile_contacts WHERE profile_id='11111111-1111-4111-8111-111111111111') THEN RAISE EXCEPTION 'leak'; END IF; END $$;
'@ },
  @{ n=13; name='13 FREE VÊ contatos do PRO';                 expect='allow'; sql=@'
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM public.profile_contacts WHERE profile_id='22222222-2222-4222-8222-222222222222' AND type='phone') THEN RAISE EXCEPTION 'deny'; END IF; END $$;
'@ },
  @{ n=14; name='14 exceção administrativa visível';          expect='allow'; sql=@'
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM public.profile_contacts WHERE profile_id='33333333-3333-4333-8333-333333333333' AND type='phone') THEN RAISE EXCEPTION 'deny'; END IF; END $$;
'@ },
  @{ n=15; name='15 mensagem em conversa sem participação';   expect='deny';  sql=@'
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
DO $$ BEGIN
  INSERT INTO public.messages (conversation_id, sender_id, content)
  SELECT id,'11111111-1111-4111-8111-111111111111','intruso'
  FROM public.conversations
  WHERE NOT EXISTS (SELECT 1 FROM public.conversation_participants cpp
                    WHERE cpp.conversation_id=conversations.id AND cpp.profile_id='11111111-1111-4111-8111-111111111111')
  LIMIT 1;
  IF FOUND THEN RAISE EXCEPTION '15 FAIL: inseriu mensagem sem participar'; ELSE NULL; END IF;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ILIKE '%security%' OR SQLERRM ILIKE '%permission denied%' OR SQLERRM ILIKE '%policy%' THEN NULL;
    ELSE RAISE; END IF;
END $$;
'@ },
  @{ n=16; name='16 OTHER NÃO vê PII (prof_profiles/company)'; expect='deny';  sql=@'
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.professional_profiles WHERE profile_id='44444444-4444-4444-8444-444444444444')
  OR EXISTS (SELECT 1 FROM public.company_profiles) THEN RAISE EXCEPTION 'leak'; END IF;
END $$;
'@ },
  @{ n=17; name='17 user NÃO manipula payments de terceiros'; expect='deny';  sql=@'
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
DO $$ BEGIN
  INSERT INTO public.payments (user_id, amount, credits, status) VALUES ('11111111-1111-4111-8111-111111111111',999,999,'approved');
  RAISE EXCEPTION '17 FAIL: conseguiu inserir payment arbitrario';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ILIKE '%security%' OR SQLERRM ILIKE '%permission denied%' OR SQLERRM ILIKE '%policy%' THEN NULL;
    ELSE RAISE; END IF;
END $$;
'@ },
  @{ n=18; name='18 user NÃO cria subscriptions';             expect='deny';  sql=@'
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
DO $$ BEGIN
  INSERT INTO public.subscriptions (profile_id, plan_id, status, amount)
  VALUES ('11111111-1111-4111-8111-111111111111',(SELECT id FROM public.plans WHERE code='pro'),'active',0);
  RAISE EXCEPTION '18 FAIL: conseguiu criar subscription';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ILIKE '%security%' OR SQLERRM ILIKE '%permission denied%' OR SQLERRM ILIKE '%policy%' THEN NULL;
    ELSE RAISE; END IF;
END $$;
'@ },
  @{ n=19; name='DB-1 definer: authenticated SEM EXECUTE add/spend'; expect='allow'; sql=@'
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname IN ('add_credits','spend_credits')
               AND has_function_privilege('authenticated',p.oid,'EXECUTE'))
  THEN RAISE EXCEPTION 'authenticated tem EXECUTE'; END IF;
END $$;
'@ },
  @{ n=20; name='DB-2 definer: is_admin responde certo';      expect='allow'; sql=@'
DO $$ BEGIN
  IF NOT public.is_admin('55555555-5555-4555-8555-555555555555') THEN RAISE EXCEPTION 'admin false';
  ELSIF public.is_admin('11111111-1111-4111-8111-111111111111') THEN RAISE EXCEPTION 'free treated admin'; END IF;
END $$;
'@ },
  @{ n=21; name='DB-3 effective_permission (PRO can_receive_leads)'; expect='allow'; sql=@'
DO $$ BEGIN
  IF NOT public.effective_permission('22222222-2222-4222-8222-222222222222','can_receive_leads')
   OR public.effective_permission('11111111-1111-4111-8111-111111111111','can_show_phone')
  THEN RAISE EXCEPTION 'perm errada'; END IF;
END $$;
'@ },
  @{ n=22; name='DB-4 is_contact_visible (PRO true / FREE false)'; expect='allow'; sql=@'
DO $$ DECLARE v uuid;
BEGIN
  SELECT cv.id INTO v FROM public.profile_contact_visibility cv
   JOIN public.profile_contacts c ON c.id = cv.profile_contact_id
   WHERE c.profile_id='22222222-2222-4222-8222-222222222222' AND c.type='phone';
  IF v IS NULL OR NOT public.is_contact_visible(v) THEN RAISE EXCEPTION 'pro oculto'; END IF;
  SELECT cv.id INTO v FROM public.profile_contact_visibility cv
   JOIN public.profile_contacts c ON c.id = cv.profile_contact_id
   WHERE c.profile_id='11111111-1111-4111-8111-111111111111' AND c.type='phone';
  IF v IS NOT NULL AND public.is_contact_visible(v) THEN RAISE EXCEPTION 'free visible'; END IF;
END $$;
'@ },
  @{ n=23; name='DB-5 spend_credits aceita tipo boost';       expect='allow'; sql=@'
BEGIN;
DO $$ DECLARE v integer; BEGIN
  v := public.spend_credits('11111111-1111-4111-8111-111111111111',1,'boost','push',NULL,NULL);
  IF NOT EXISTS (SELECT 1 FROM public.credits_ledger WHERE profile_id='11111111-1111-4111-8111-111111111111' AND type='boost')
  THEN RAISE EXCEPTION 'sem boost no ledger'; END IF;
END $$;
ROLLBACK;
'@ },
  @{ n=24; name='DB-6 ledger: cadeia monotônica (invariante)'; expect='allow'; sql=@'
DO $$ DECLARE r record; bad integer := 0; BEGIN
  FOR r IN (SELECT amount, balance_after, lag(balance_after) OVER (ORDER BY id) prv FROM public.credits_ledger WHERE profile_id='11111111-1111-4111-8111-111111111111' ORDER BY id) LOOP
    IF r.prv IS NOT NULL AND r.balance_after <> r.prv + r.amount THEN bad := bad+1; END IF;
    IF r.balance_after < 0 THEN bad := bad+1; END IF;
  END LOOP;
  IF bad > 0 THEN RAISE EXCEPTION 'ledger quebrado'; END IF;
END $$;
'@ },
  @{ n=25; name='DB-7 unique gateway_payment_id bloqueia dupla'; expect='allow'; sql=@'
DO $$ DECLARE v text := gen_random_uuid()::text; BEGIN
  INSERT INTO public.payments (user_id, amount, credits, status, gateway, gateway_payment_id)
  VALUES ('11111111-1111-4111-8111-111111111111',100,100,'approved','mercadopago',v);
  BEGIN
    INSERT INTO public.payments (user_id, amount, credits, status, gateway, gateway_payment_id)
    VALUES ('11111111-1111-4111-8111-111111111111',100,100,'approved','mercadopago',v);
    RAISE EXCEPTION 'duplicado aceito';
  EXCEPTION WHEN unique_violation THEN NULL; END;
END $$;
'@ },
  @{ n=26; name='ORD-1 anon NÃO acessa PII (ESPERADO FAIL atê 911)'; expect='deny'; sql=@'
SET ROLE anon;
SELECT set_config('request.jwt.claims','{"role":"anon"}',true);
DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.orders WHERE phone IS NOT NULL AND phone<>'') THEN RAISE EXCEPTION 'leak'; END IF; END $$;
'@ }
)

# ---------- SUÍTES DE ARQUIVO (logic/transaction) ----------
$suites = @(
  @{ n='F1'; file='supabase\migrations\tests\security_definer_v21.sql'; exp=0 },
  @{ n='F2'; file='supabase\migrations\tests\credits_ledger_v21.sql';   exp=0 },
  @{ n='F3'; file='supabase\migrations\tests\migrate_client_user_v21.sql'; exp=0 },
  @{ n='F4'; file='supabase\migrations\tests\orders_pii_v21.sql';       exp=0 }
)

# execute RLS assertion list
foreach ($t in $tests) {
  $r = Invoke-Psql $t.sql
  if ($pre.Code -ne 0) { $st='NOT TESTABLE'; $d='SET ROLE indisponivel via psql' }
  else {
    $ok = ($r.Code -eq 0)
    if ($t.expect -eq 'deny' ) { $st = if ($ok) {'PASS'} else {'FAIL'}; $d = if ($ok) {'acesso negado'} else {"houve acesso indevido: $($r.Err.Trim())"} }
    else                       { $st = if ($ok) {'PASS'} else {'FAIL'}; $d = if ($ok) {'acesso permitido'} else {"falhou: $($r.Err.Trim())"} }
  }
  Write-Host ("[{0}] TEST {1}: {2:24} {3}" -f $st, $t.n, $t.name, $st)
  Add-Result $t.n $t.name 'RLS' $st $d
}

foreach ($s in $suites) {
  $r = Invoke-Psql $s.file -File
  if ($r.Code -eq $s.exp) { $st='PASS'; $d='exit 0' } else { $st='FAIL'; $d=$r.Err.Trim() }
  Write-Host ("[{0}] TEST {1}: suite {2} {3}" -f $st, $s.n, (Split-Path $s.file -Leaf), $st)
  Add-Result $s.n (Split-Path $s.file -Leaf) 'SUITE' $st $d
}

# ---------- RELATÓRIO ----------
$results | ForEach-Object {
  "{0};{1};{2};{3};{4}" -f $_.id, $_.name, $_.kind, $_.status, $_.details  | Add-Content -Path "$out.csv" -Encoding UTF8
}
$pass = ($results | Where-Object status -eq 'PASS').Count
$fail = ($results | Where-Object status -eq 'FAIL').Count
$nt   = ($results | Where-Object status -eq 'NOT TESTABLE').Count
Write-Host ""
Write-Host "RESUMO: PASS=$pass FAIL=$fail NOT_TESTABLE=$nt"
$results | ForEach-Object { "[{0}] TEST {1}: {2}" -f $_.status, $_.id, $_.name }
"#" + " RESULTADOS $ts — PASS=$pass FAIL=$fail NOT_TESTABLE=$nt" | Add-Content -Path "$out.log" -Encoding UTF8
$results | Format-Table id,name,kind,status,details -AutoSize | Out-String -Width 400 | Add-Content -Path "$out.log" -Encoding UTF8
Write-Host "Log: $out.log | CSV: $out.csv"
if ($fail -gt 0) { exit 1 } else { exit 0 }