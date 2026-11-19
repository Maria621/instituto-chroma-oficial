# Etapa 3 — componentes HTML reutilizáveis (V14)

## Alterações implementadas

- Fonte única para cabeçalho, rodapé e link de salto em `src/components/`.
- Conteúdo editorial preservado nas 12 páginas em `src/pages/`; os arquivos HTML na raiz continuam servidos diretamente pelo Vercel.
- Geração estática com Node.js nativo, sem framework, dependências de build ou montagem de HTML no navegador.
- Os títulos, fontes, estilos, imagens, scripts, estados de navegação e detalhes de acessibilidade são preservados **byte a byte** no output inicial.
- O gerador faz verificação estrita de placeholders e falha quando um arquivo publicado não corresponde à sua fonte.
- O GitHub Actions executa `node scripts/build-pages.mjs --check` antes das demais validações.

## Fluxo para próximas alterações

```bash
# Edite src/pages/<pagina>.html ou src/components/*.html
node scripts/build-pages.mjs
node scripts/build-pages.mjs --check
node tests/validate-site.mjs
# Os testes em Chrome e a comparação visual continuam no GitHub Actions
```

**Importante:** não editar diretamente os 12 HTMLs gerados na raiz. Mudanças em `src/pages` ou `src/components` precisam ser acompanhadas da geração dos HTMLs finais no mesmo PR. O Vercel continua servindo os arquivos estáticos mesmo quando o JavaScript está desativado.

## Preservação de comportamento

- `index.html`: cabeçalho transparente com logo branco; páginas internas: `header-solid` com logo azul.
- Estado atual de navegação mantido como no código anterior, incluindo uma inconsistência histórica de `aria-current` na página `aluno-nota-10.html`. Corrigir essa inconsistência junto à auditoria UX/ARIA posterior, sem misturar com a migração estrutural.
- O contato mantém sua API, formulário e regras de segurança da V13.
- Nenhum CSS, JavaScript de runtime ou texto institucional foi modificado nesta etapa.
- `.vercelignore` impede que templates, scripts internos, testes e documentação sejam enviados ao ambiente público do Vercel; o HTML gerado, assets e API continuam incluídos.

## Critérios de aceite

- 12 templates e 12 HTMLs gerados, com comparação exata sem divergências.
- Checks de estrutura, links, scripts, segurança, layout responsivo e capturas visuais aprovados.
- Alterações futuras no componente compartilhado aparecem em todas as páginas após `build`.
- Nenhuma dependência de JavaScript do navegador para que cabeçalho, rodapé e conteúdo sejam renderizados.
