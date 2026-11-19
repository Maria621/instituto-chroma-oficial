# Etapa 1 — Estabilidade, regressão visual e controle de publicação

## Critério de aprovação

O código institucional só deve ser tratado como apto à publicação quando:

1. Os testes de HTML, CSS, JavaScript e formulário estiverem verdes.
2. O Chrome validar as 12 páginas nas nove larguras já cobertas.
3. O comparativo visual de 6 páginas críticas em 390, 1024 e 1440 pixels for conferido.
4. Se houver diferenças relevantes (mais de 1,2% dos pixels), um revisor inspecionar as imagens **antes/depois/diff** e aplicar a label `visual-approved` no PR apenas se a mudança for intencional.
5. Após o merge, o CI da `main` estiver verde. Um CI aprovado no PR **não** substitui o CI da `main`.
6. O Vercel reportar `READY`, o alias oficial apontar para o deployment esperado e o campo `meta.githubCommitSha` ser igual ao SHA de `main`.

**Importante:** a interface visual não foi redesenhada nesta etapa; o objetivo é construir barreiras contra regressões futuras.

## Fluxo de trabalho

1. Criar branch de melhoria a partir da `main`.
2. Abrir PR e revisar o conteúdo alterado.
3. GitHub Actions executa automaticamente:
   - `static-check`: estrutura e testes simulados do contato.
   - `browser-layout`: 12 páginas e 9 larguras, links, interações e recortes.
   - `visual-review`: compara as versões anterior e proposta e anexa capturas em artifact.
4. Quando a proposta altera o layout de propósito, o revisor confere as capturas e usa a label `visual-approved`. A label autoriza a **diferença visual deliberada**, mas não ignora erros de carregamento, imagens quebradas ou falhas dos demais testes.
5. Realizar merge e aguardar todos os checks na `main`.
6. Criar/conferir deployment de produção (conforme limite e configurações de Vercel).
7. Conferir o SHA do deployment e o domínio; **não anunciar como publicado sem esta correspondência**.

## Artefatos visuais

No GitHub Actions do PR: `Regressão visual comparativa` → artifact `comparativo-visual-<run_id>` (retenção de 14 dias).

Conteúdo:
- `before/<largura>/<pagina>.png` — versão base;
- `after/<largura>/<pagina>.png` — proposta;
- `diff/<largura>/<pagina>.png` — diferenças superiores ao limite;
- `comparison.json` — percentual de pixels distintos por tela;
- `manifest-before.json` e `manifest-after.json` — páginas, resoluções, imagens e erros.

São capturas automatizadas para revisão humana. Não substituem testes reais de acessibilidade, imagens autênticas ou medidas de Core Web Vitals.

## Ferramenta de verificação do Vercel

```bash
# Não compartilhe nem faça commit do token.
VERCEL_TOKEN=<seu-token> node scripts/verify-production.mjs <sha-completo-de-main>
```

Alternativa: workflow manual `Conferir versão publicada`, com input `commit_sha` e Secret `VERCEL_TOKEN` configurado pela equipe no GitHub. O script consulta somente a API Vercel; não modifica nem publica o site.

Se faltar a credencial, se o deployment estiver pendente, se o SHA divergir ou se o alias não estiver atribuído, **a verificação falha em vez de anunciar sucesso**. É possível conferir os mesmos dados manualmente pelo painel ou ferramenta conectada.

## Condições externas e bloqueios

- O domínio `instituto-chroma-oficial.vercel.app` ainda apontava para a V8 no início desta etapa, enquanto o GitHub estava na V11.
- O Vercel já reportou limite diário gratuito de 100 deployments em solicitações anteriores. Esse bloqueio só pode ser contornado quando o limite for liberado ou após ação autorizada do proprietário da conta.
- Não foram recebidas credenciais de produção; nenhuma foi adicionada ao repositório.
- Proteção da branch `main` deve exigir **HTML, links, acessibilidade e scripts**, **Texto completo e navegação em telas reais** e **Regressão visual comparativa**, com revisão de PR antes de merge. A leitura/alteração das regras de proteção depende das permissões de administrador do GitHub; não foi possível configurá-las via integração disponível.
- O `noindex` permanece porque a revisão de conteúdo, documentos legais e infraestrutura de contato ainda não foi concluída.

## Checklist final de release

- [ ] PR avaliado e visual aprovado (se alterado)
- [ ] Todos os três checks do PR verdes
- [ ] Todos os três checks da main verdes
- [ ] Deployment de produção Vercel READY
- [ ] Alias público `instituto-chroma-oficial.vercel.app` atribuído
- [ ] SHA publicado igual ao commit esperado de `main`
- [ ] Home, navegação, formulário e páginas principais verificados no domínio
