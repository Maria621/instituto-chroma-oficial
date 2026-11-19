# Instituto Chroma — V8: revisão de conteúdo e integridade visual

## Problema
Textos extensos eram comprimidos ou poderiam ser cortados em algumas larguras por tipografia grande, colunas estreitas, regras `white-space: nowrap`, barras de navegação e caixas visuais com `overflow: hidden`. A história institucional também estava genérica em relação às informações já fornecidas.

## Atualizações editoriais
- **Página inicial:** origem em Diadema (2016), propósito inicial, fundadora Adriana e evolução da metodologia; textos com percurso narrativo e foco pedagógico.
- **Nossa escola:** marcos de 2016, evolução dos conteúdos e expansão de atuação, sem inventar os anos exatos da abertura de cada unidade. Registros específicos de 2026 permanecem em linha do tempo separada.
- **Estrutura:** computadores (mais de 42, segundo a escola), sala para projetos, lousa e acompanhamento dos professores. Imagem conceitual permanece identificada.
- **Metodologia:** preservada a quinta etapa de retomada na lousa e aplicação no computador.
- **Aluno Nota 10:** gestão independente da Chroma, por outra organização sem fins lucrativos; informações de bolsas sujeitas às regras vigentes. Removida chamada de contato duplicada.
- **Parcerias:** diferenciado projeto interno de sala de aula de proposta com instituições externas.
- **Unidades:** Diadema e Sorocaba com endereço provisório; histórico de expansão para Valinhos sem indicar endereço ou horário não verificado.

## Correções técnicas
- Revisão responsiva de tamanhos e entrelinhas de títulos e parágrafos.
- Remoção de `nowrap` de botões e links de ação que precisam quebrar linha.
- Colunas com `minmax(0, ...)`, `min-width: 0` e larguras apropriadas para leitura, sem altura fixa sobre os textos.
- Galeria editorial e cards ajustados para crescer com o conteúdo.
- Menu compacto acionado em 1300 px ou menos, com breakpoint correspondente no JavaScript.
- Banners oficiais exibidos inteiros com `object-fit: contain`.
- Nova seção histórica com cartões que fluem verticalmente em tablets e celulares.
- Testes de navegador com Playwright em 360, 390, 768, 1024, 1280 e 1440 px verificam clipping e navegação.

## Validação e limites
- Testes estáticos: links locais, âncoras, IDs, um main/h1 por página, rodapé idêntico, CSS equilibrado.
- Testes reais em navegador: CI deve aprovar antes do merge para produção.
- O fluxo de envio de e-mail permanece inalterado, assim como o `noindex`, até a revisão final.
- Fotografias reais das unidades, endereços/horários oficiais e marcos históricos adicionais devem ser confirmados antes do lançamento definitivo.
