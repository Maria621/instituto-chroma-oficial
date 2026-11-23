# Instituto Chroma — Etapas 5 a 8 (V16)

## Objetivo e limites
As etapas abaixo elevam a qualidade do site institucional existente. Preservam sua identidade visual, azul predominante, tipografia Manrope/DM Sans, estrutura multipáginas e conteúdo pedagógico já aprovado.

**Importante:** engenharia concluída não equivale a site autorizado para indexação. Fotografias reais autorizadas, endereços de visita, contato funcional, revisão jurídica e métricas reais em produção exigem validação adicional.

## Etapa 5 — JavaScript organizado
- Dez componentes com responsabilidade definida em `src/scripts/`: cabeçalho, navegação, metodologia, experiência, galeria legada, ampliação, galeria editorial, revelação progressiva, linha do tempo e contato.
- `src/scripts/manifest.json` define quais módulos compõem os cinco arquivos de navegador.
- `scripts/build-js.mjs` gera `app.js`, `v31.js`, `fusion.js`, `timeline.js` e `contact.js` sem framework ou pacotes de runtime.
- O CI falha se os JS públicos não corresponderem às fontes ou se um módulo tiver erro de sintaxe.

## Etapa 6 — UX, UI e acessibilidade
- Estados `aria-current="page"` corrigidos no menu desktop, mobile e botão de contato: o destaque agora corresponde à página realmente visitada.
- Anel de foco com contraste em fundos claros e escuros, além de margem de rolagem para alvos internos.
- Navegação por teclado, galeria, menu e linha do tempo continuam verificadas em nove larguras.
- Nova auditoria de WCAG automatizada com axe-core em 12 páginas × 2 larguras. Falhas sérias/críticas bloqueiam o PR. Isso não substitui leitores de tela e revisão humana.

## Etapa 7 — Conteúdo institucional verificável
- A linha histórica passa a identificar os marcos **2016 Diadema, 2019 Itavuvu/Sorocaba e 2022 Pannunzio/Anhanguera**, com **Valinhos anunciado para 2026, ainda sem data de atendimento confirmada**.
- Ações de 2026 permanecem em seção independente, sem serem apresentadas como história de fundação.
- Endereços que constavam como provisórios de diretórios externos foram retirados, juntamente com links para mapas não confirmados, para não induzir responsáveis a deslocamentos errados.
- A seção de unidades identifica Valinhos como futura expansão, não como atendimento já aberto.
- Não foram adicionadas fotografias sintéticas como se fossem reais. A colocação de fotos autorizadas permanece pendente da equipe.

## Etapa 8 — Performance, SEO e preparação do lançamento
- Cinco requisições CSS foram consolidadas em **um arquivo `site.css`** gerado a partir das fontes V15, mantendo a ordem da cascata.
- Todas as páginas têm URL canônica única, metadados Open Graph de endereço e locale `pt_BR`.
- A home contém dados estruturados `EducationalOrganization` sem divulgar telefones/endereço não validados e pré-carregamento da imagem prioritária do hero.
- `vercel.json` define headers defensivos básicos e cache moderado de assets.
- `scripts/audit-launch.mjs --check-pages` verifica URLs, metadados, conteúdo HTML, pacote CSS e orçamento bruto de JS/CSS.
- `scripts/audit-launch.mjs --release` **falha** se `noindex`, minuta de privacidade, endereços pendentes, ausência de fotos reais, variáveis de contato ou autorização de lançamento continuarem presentes.
- `--write-sitemap` só gera o sitemap após a aprovação de todos os requisitos. Não foram ativadas indexação, envio de dados, tracking ou alterações de privacidade.

## Critérios e validação
1. `node scripts/build-css.mjs --check`, `node scripts/build-js.mjs --check` e `node scripts/build-pages.mjs --check` precisam mostrar zero divergências.
2. `node tests/validate-site.mjs`, `node tests/contact-api.test.mjs` e `node scripts/audit-launch.mjs --check-pages` devem aprovar.
3. Chrome percorre 12 páginas × 9 larguras. Axe avalia 12 páginas × 2 larguras. Screenshots antes/depois verificam 6 páginas × 3 larguras.
4. Mudanças visuais relevantes recebem revisão humana e label `visual-approved`, sem ignorar erros reais.
5. CI da `main` deve passar após merge; Vercel deve indicar estado READY e SHA publicado igual ao aprovado.

## Pendências do lançamento (não inventar nem contornar)
- Fotografias reais e autorização de uso de imagem das unidades, equipe e alunos.
- Endereços, contatos e horário de cada unidade, inclusive situação de Valinhos.
- Texto e aprovação jurídica da política de privacidade e canal LGPD.
- Configuração autorizada de Resend, Turnstile e proteção de taxa do endpoint, com teste real de entrega.
- Lighthouse/PageSpeed em produção e Core Web Vitals em dados reais (LCP <=2,5s; INP <200ms; CLS <0,1). São metas, **não resultados medidos**.
- Validação manual com leitores de tela e dispositivos reais.

**Não retirar o `noindex` enquanto qualquer condição impeditiva persistir.**
