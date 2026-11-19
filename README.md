# Instituto Chroma — site institucional

Site institucional multipáginas da Escola Chroma. Projeto em revisão pré-lançamento, com foco em experiência de navegação, credibilidade institucional e acessibilidade.

> **Estado de publicação:** o commit no GitHub e o conteúdo do domínio Vercel são estados distintos. Confira o SHA do deployment antes de declarar uma versão publicada. As páginas possuem `noindex` até aprovação oficial.

## Estrutura atual

```text
/
├── index.html                   # Apresentação institucional
├── nossa-escola.html            # História e marcos institucionais
├── nossa-essencia.html          # Missão, visão e valores
├── metodologia.html             # Percurso de aprendizagem
├── estrutura.html               # Ambientes e recursos
├── experiencia-chroma.html      # Projetos pedagógicos
├── unidades.html                # Unidades e visita
├── novidades.html               # Campanhas e comunicados
├── aluno-nota-10.html           # Informações sobre o projeto
├── parcerias.html               # Colaboração externa
├── contato.html                 # Atendimento
├── privacidade.html             # Minuta de privacidade
├── assets/                      # Artes e recursos estáticos
├── style.css                    # Base histórica (ainda não consolidada)
├── fusion.css                   # Componentes editoriais da home
├── v31.css                      # Navegação, campanhas e componentes de notícias
├── quality.css                  # Tokens, tipografia e ajustes transversais
├── app.js                       # Cabeçalho, método e contato (legado; separar no futuro)
├── v31.js                       # Navegação e ampliador de artes
├── fusion.js                    # Galeria da home
├── timeline.js                  # Abas da linha do tempo
├── api/contato.js               # Endpoint do contato, dependente de configuração
├── tests/validate-site.mjs      # HTML, arquivos, âncoras, sintaxe e estrutura
├── tests/contact-api.test.mjs   # Testes simulados de segurança do contato
├── tests/browser-layout.mjs     # Layout e interações reais com Chrome
├── tests/visual-review.mjs      # Capturas e comparação visual antes/depois
├── scripts/verify-production.mjs # Compara o SHA aprovado ao Vercel (somente leitura)
├── .github/workflows/conferir-producao.yml # Validação manual do domínio publicado
└── .github/workflows/qualidade.yml
```

O código atual é **HTML/CSS/JavaScript sem um framework de componentes**. O rodapé e o cabeçalho ainda estão duplicados entre páginas; `style.css` e `quality.css` contêm regras legadas acumuladas. Esta é uma dívida técnica conhecida, não uma arquitetura que deve ser perpetuada.

## Responsabilidades e critérios de desenvolvimento

1. **HTML:** manter uma página por função, um `main`, um `h1`, cabeçalhos em ordem lógica e atributos acessíveis. Não acrescentar conteúdo institucional não confirmado.
2. **CSS:** corrigir cada componente no seu arquivo responsável. Novidades e botão de ampliar: `v31.css`. Componentes exclusivos da home: `fusion.css`. Ajustes transversais e tokens: `quality.css`. Evitar anexar `!important` ou regras de versão nova sem remover as antigas quando possível.
3. **JavaScript:** usar componentes isolados por responsabilidade, verificar elementos antes de adicionar listeners, manter `aria-expanded`, foco e comportamento de teclado coerentes; não criar botões sem ação.
4. **Contato e dados:** nunca afirmar que uma mensagem foi enviada antes de receber sucesso do provedor. Não solicitar dados se o endpoint não estiver configurado. A política de privacidade ainda depende de validação jurídica.
5. **Imagens:** preservar proporção natural e identificar artes conceituais; não apresentá-las como fotografias reais de alunos ou unidades.
6. **Release:** revisar o diff, executar CI em PR e em `main`, validar no navegador, verificar o SHA do deploy no Vercel. Regressões na `main` bloqueiam aprovação.

## Executar a validação

```bash
node tests/validate-site.mjs
node tests/contact-api.test.mjs

# Necessário para os testes de navegador locais:
npm install --no-save playwright@1.55.0
node tests/browser-layout.mjs
```

Os testes de navegador usam o Chrome (`channel: 'chrome'`). As verificações cobrem múltiplas larguras de tela, mas **não** substituem testes de leitores de tela, revisão editorial, métricas reais de desempenho e autorização institucional.

## Próxima etapa de arquitetura

Planejar migração progressiva e testada para componentes reutilizáveis de cabeçalho, rodapé, cards e seções. Uma implementação com templates/build (como Astro ou Eleventy) pode eliminar a duplicação de páginas sem alterar a interface. A migração deve ser feita em branch própria, com comparação visual e aprovação por página — não por substituição massiva do código atual.

## Processo de publicação (Etapa 1)

Ver [ETAPA_1_ESTABILIDADE_V12.md](ETAPA_1_ESTABILIDADE_V12.md) para o procedimento completo. A nova rotina inclui capturas antes/depois da proposta, diff visual e conferência do SHA no domínio real. Um teste de PR aprovado **não** significa que a produção foi atualizada. Regras de proteção da branch devem ser configuradas pelo administrador com os três checks do CI.
