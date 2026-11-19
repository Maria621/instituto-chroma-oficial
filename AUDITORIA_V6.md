# Instituto Chroma — revisão de qualidade V6

## Objetivo
Refinar a versão institucional V5 sem refazer sua identidade, separando o papel de cada página e corrigindo problemas de usabilidade, acessibilidade e manutenção.

## Intervenções concluídas
1. **Cabeçalho e identidade:** corrigido o reconhecimento da home V5; logotipo oficial branco no cabeçalho escuro e azul no cabeçalho claro. Interação do dropdown e ciclo de foco do menu mobile corrigidos.
2. **Consistência visual:** camada `quality.css` centraliza ajustes de hierarquia, espaçamento, cartões, rodapé, responsividade e estados de foco; tipografia Manrope/DM Sans carregada com `display=swap`.
3. **Missão, visão e valores:** cartões lado a lado em desktop, empilhados em telas menores, com leitura mais confortável.
4. **Metodologia x experiências:** página Metodologia descreve etapas de aula e acompanhamento; Experiência Chroma apresenta projetos e exemplos práticos. Chamada duplicada removida da história da escola.
5. **Galeria:** textos por `data-*` no HTML, navegação cíclica por setas, dots, teclado e toque; ampliação via `<dialog>` nativo com controles anterior/próximo realmente acionáveis.
6. **Melhoria progressiva:** conteúdo animado permanece visível quando scripts estão desativados; acordeão de metodologia tem descrições legíveis sem JavaScript e usa `aria-expanded` com controles associados quando ativado.
7. **Desempenho:** substituição de imagem WebP de ~153 KB em base64 embutida no `style.css` por AVIF existente. CSS base reduzido de ~238 KB para ~85 KB (64%). Imagens de conteúdo usam `loading=lazy`, com a hero mantendo prioridade alta.
8. **Navegação e metadados:** todos os links de “voltar ao topo” apontam para a página atual; Open Graph e ícone institucional incluídos nas 12 páginas; rodapés seguem identidade editorial em vez de textos de prévia.

## Verificações estáticas automatizadas
- 12 HTML: apenas um elemento `main` e um `h1` por página.
- Nenhum `id` duplicado nas páginas verificadas.
- URLs relativas, âncoras internas, `aria-controls` e recursos locais verificados.
- Todos os elementos `img` com atributo `alt`.
- 3 scripts JavaScript compilam sintaticamente; 4 arquivos CSS com chaves equilibradas.
- Nenhum erro detectado nos itens acima.

## Ainda a validar manualmente em navegador
- Inspeção visual em 360, 390, 768, 1024 e 1440 px.
- Contraste real e testes de leitores de tela em plataformas-alvo.
- Verificação visual final de cada imagem e banner.
- LCP, INP, CLS e auditoria Lighthouse em ambiente com rede.
- Envio do formulário (mantido intocado nesta revisão, por decisão editorial anterior).
- Datas institucionais, cidades, condições dos projetos, contatos e eventual liberação de `noindex` antes da divulgação oficial.

## Estrutura
- `style.css`: fundamentos e estilos legados.
- `v31.css`: recursos das páginas internas.
- `fusion.css`: design da home unificada.
- `quality.css`: refinamentos V6 e padrões transversais.
- `app.js`: comportamentos compartilhados e formulário.
- `v31.js`: navegação e diálogos das artes.
- `fusion.js`: galeria da home e revelação progressiva.

Não publicar imagens conceituais como fotografias das instalações ou da equipe. Preservar o logotipo oficial e as artes originais.
