# Etapa 4 — Organização do CSS (V15)

## O que mudou

- Os estilos continuam com a **mesma cascata e os mesmos seletores** nas quatro folhas históricas.
- Variáveis de **fontes, cores, superfícies, espaçamentos e proporções** agora vêm de `src/styles/tokens.css`.
- Três declarações antigas de `--chroma-yellow` viraram uma definição única com o valor final já usado pelo site: `#ffe025`.
- O CSS de origem foi dividido por responsabilidade em `src/styles/base/`, `components/`, `pages/` e `quality/`.
- `src/styles/manifest.json` fixa explicitamente a ordem dos módulos; `scripts/build-css.mjs` compila cinco arquivos CSS públicos sem dependências.
- Todas as 12 páginas carregam `tokens.css` antes das folhas anteriores. O Vercel continua servindo CSS estático.
- O GitHub Actions exige que os arquivos CSS da raiz estejam sincronizados com o código de origem; também executa verificação estrutural, funcional, responsiva e capturas visuais.
- O gerador bloqueia tokens duplicados, variáveis não declaradas e aumento do total legado de 55 regras com `!important`.

## Como manter corretamente

```bash
# Altere os arquivos em src/styles/, não os CSS gerados na raiz
node scripts/build-css.mjs
node scripts/build-css.mjs --check
node scripts/build-pages.mjs --check
node tests/validate-site.mjs
```

Não reordenar módulos nem media queries sem validar o efeito visual. Os módulos mantêm a ordem dos estilos anteriores para preservar todos os layouts e componentes aprovados.

## Dívida técnica restante

- **55 ocorrências de `!important`** ainda existem. Foram preservadas para evitar uma regressão de cascata sem uma revisão de componentes.
- Algumas regras entre V6, V7, V8, V9 e V10 continuam se sobrepondo. A redução dessas regras exigirá comparação de estilos computados e análise de dependências por página.
- Ainda é necessário avaliar performance real, ampliar testes de acessibilidade e verificar imagens reais/autorizadas.
- Esta alteração não muda textos, navegação, fotos nem scripts de runtime.

## Critérios de aceite

1. Cinco CSS gerados sem divergências; todos os 38 tokens em um único arquivo.
2. CSS das 12 páginas com a ordem de carregamento correta.
3. Nenhum crescimento de `!important` nem variáveis ausentes.
4. Testes do GitHub Actions aprovados e comparação visual sem diferenças relevantes.
5. SHA do deployment correspondente à `main` antes de afirmar que a versão está no ar.