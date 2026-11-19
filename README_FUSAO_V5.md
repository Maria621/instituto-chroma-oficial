# Instituto Chroma — Fusão Institucional V5

**Estado:** prévia de revisão, branch `fusao-institucional-v5`; não foi aplicada à branch principal nem publicada em produção.

## Origem da fusão
- Base multipágina: `Maria621/Chroma-v.1`, branch `revisao-institucional-v4` (inclui refinamentos V4.3).
- Concepção editorial e identidade da V2: `Maria621/chroma-v.2`, branch `main` (V2.2).
- Três recursos visuais conceituais da V2 foram incorporados localmente sob `assets/fusion-*`, além das artes já disponíveis na V1.

## O que foi construído
- **Página inicial nova**: hero editorial com moldura inclinada, narrativa focada em educação e missão, sequência de aprendizagem em quatro etapas, galeria, iniciativas, convites distintos para escolas e empresas, cidades e contato.
- **Páginas internas preservadas**: Nossa escola, Nossa essência, Metodologia, Estrutura, Experiência, Unidades, Novidades, Aluno Nota 10, Parcerias, Contato, Privacidade.
- **Unificação estética** em `fusion.css`: tipografia, azul Chroma, espaço em branco, navegação limpa, cartões e grids responsivos. Todas as páginas usam a nova camada.
- **Interações** em `fusion.js`: galeria com pontos (sem números 1/7), botões, teclado, toque/swipe, ampliação em modal e animações que respeitam a opção de movimento reduzido.
- **Logo oficial** permanece sem edição. As imagens publicitárias mantêm proporções sem cortes arbitrários.
- **Arquitetura editorial**: a página inicial resume e encaminha; detalhes permanecem nas páginas específicas. Não há catálogo de venda de cursos.
- **Menu**: mantém a correção V4.3 do SVG discreto, fechamento por clique novamente, clique fora e Escape; o menu mobile fecha ao selecionar um link.

## Verificações realizadas
- Conferidos caminhos relativos nos 12 HTML e os três recursos da V2 adicionados.
- Conferida a existência do CSS novo em todas as páginas.
- Validada a presença de um único `main` por página e a preservação de `noindex` durante a revisão.
- **Ainda é necessário** executar inspeção visual no navegador em desktop e celular e testes reais de formulário / envio antes de produção.

## Dependências para publicação
- O fluxo de e-mail/contato não foi alterado, conforme solicitação de tratá-lo por último. Não anunciar envio efetivo se o endpoint ainda não estiver configurado.
- Confirmar endereços completos/horários com a escola. Nomes das localidades Diadema e Sorocaba aparecem sem informação de visita não validada.
- As imagens assinaladas como conceituais são ilustrações e **não fotos documentais** de estudantes, equipe ou unidades. Substituir por fotos autorizadas, quando disponíveis.
- Conferir regulamento, condições e vigência do projeto Aluno Nota 10 e demais campanhas antes da publicação.
- Validar material jurídico/LGPD e meta tags no domínio definitivo.

## Como usar
Abra `index.html` com servidor estático ou visualizador local. A estrutura usa HTML, CSS e JavaScript sem necessidade de framework. Mantenha as pastas e nomes de arquivos como estão.

**Arquivos novos:** `fusion.css`, `fusion.js`, `assets/fusion-chroma-educacao-em-acao.webp`, `assets/fusion-chroma-pessoas-detalhe.webp`, `assets/fusion-chroma-ambiente-conceitual.webp`.

**Arquivos modificados:** `index.html` e as páginas internas para incluir `fusion.css`.
