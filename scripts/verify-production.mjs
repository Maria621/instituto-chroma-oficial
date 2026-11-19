/**
 * Verify that the public production alias serves the exact approved Git SHA.
 * Does not deploy anything.
 *
 * Usage:
 *   VERCEL_TOKEN=... node scripts/verify-production.mjs <40-character Git SHA>
 *
 * Optional env:
 *   VERCEL_TEAM_ID, CHROMA_PRODUCTION_HOST
 */
const expectedSha = (process.argv[2] || process.env.EXPECTED_COMMIT_SHA || '').trim();
const token = process.env.VERCEL_TOKEN;
const teamId = process.env.VERCEL_TEAM_ID || 'team_rQpTIXqmRNYzJ3PAbY9tdn5p';
const host = process.env.CHROMA_PRODUCTION_HOST || 'instituto-chroma-oficial.vercel.app';

if (!/^[a-f0-9]{40}$/i.test(expectedSha)) {
  console.error('ERRO: informe um SHA completo e válido de 40 caracteres.');
  process.exit(2);
}
if (!token) {
  console.error('ERRO: VERCEL_TOKEN não configurado. Não é possível confirmar o deploy com segurança.');
  process.exit(2);
}

try {
  const uri = new URL('https://api.vercel.com/v13/deployments/' + encodeURIComponent(host));
  uri.searchParams.set('teamId', teamId);
  const response = await fetch(uri, {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!response.ok) {
    throw Error('Vercel API: HTTP ' + response.status + ' ao consultar o alias público');
  }
  const deployment = await response.json();
  const liveSha = deployment.meta?.githubCommitSha || '';
  const state = deployment.readyState || deployment.state;
  const aliases = deployment.alias || [];
  const published = aliases.includes(host);

  console.log('Commit solicitado: ' + expectedSha);
  console.log('Commit em produção: ' + (liveSha || 'não disponível'));
  console.log('Estado do deploy: ' + (state || 'desconhecido'));
  console.log('Alias público presente: ' + published);

  if (state !== 'READY' || liveSha !== expectedSha || !published) {
    console.error('REPROVADO: o domínio público NÃO está na versão solicitada.');
    process.exitCode = 1;
  } else {
    console.log('APROVADO: Vercel READY, commit e alias de produção correspondem.');
  }
} catch (error) {
  console.error('ERRO ao validar produção: ' + error.message);
  process.exitCode = 1;
}
