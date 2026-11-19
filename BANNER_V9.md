# Revisão V9 — banner principal

## Diagnóstico confirmado
A arte visual-hero.avif tem dimensão intrínseca de **1100 × 619 pixels**, proporção horizontal próxima a 16:9. O HTML a declarava como 750 × 950 (vertical) e o CSS a exibia com moldura alta, `object-fit: cover`, zoom e contrarrotação, causando recortes. O hero ainda tinha regras acumuladas de altura mínima próximas de 860px.

## Solução
- Corrigido no HTML o tamanho intrínseco de 1100 × 619.
- Mantida a combinação de fontes e o texto editorial da home já aprovado.
- Eliminadas as alturas fixas para o banner e a moldura da imagem.
- Imagem integral, sem zoom nem contrarrotação, com `object-fit: contain` e legenda externa.
- Moldura horizontal levemente inclinada, com cartão de mensagem posicionado abaixo em vez de sobre a arte.
- Ajustes proporcionais de título, parágrafo e espaçamento nas versões desktop, notebook, tablet e celular.
- Nova verificação automatizada do hero: dimensões, imagem sem crop, caixa dentro do viewport e limite de altura.
- Não alterados conteúdo das páginas internas, fontes, navbar ou formulários.

## Teste de qualidade
`node tests/validate-site.mjs` e `node tests/browser-layout.mjs` devem aprovar via GitHub Actions antes do merge. O navegador será testado em 360, 390, 768, 1024, 1280 e 1440px.
