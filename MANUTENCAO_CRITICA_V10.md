# Escola Chroma — manutenção crítica V10

## Objetivo
Primeira rodada técnica após a auditoria executiva: corrigir problemas com solução verificável antes de alterar a identidade aprovada ou ativar recursos sem infraestrutura.

## Corrigido nesta rodada
- **Home e primeira dobra:** mensagem principal mais direta e menor, sem repetir “experiência”; mantém Manrope + serifada, azul, amarelo, duas colunas e a imagem completa. Espaçamentos mobile reduzidos para a seção não monopolizar a navegação.
- **História x novidades:** o link “Explore nossa história” agora leva aos marcos institucionais desde 2016 (`#linha-do-tempo`); os registros de aulas e campanhas de 2026 passam a ter área própria (`#atividades-2026`).
- **Contraste:** cores de rótulos pequenos da linha do tempo, rodapé e legendas corrigidas para melhor leitura; teste calcula contraste de amostras e exige 4,5:1.
- **Contato quando indisponível:** não pedir para preencher dados ou consentimento se a integração de e-mail estiver desativada. Exibir acesso direto ao Instagram institucional como alternativa; o comportamento não depende de JavaScript para iniciar no estado seguro.
- **Validação de envio:** o backend passa a rejeitar mensagem curta/vazia, unidade/perfil/assunto inválidos, telefone desproporcional e corpo com formato diferente de JSON. Testes simulados não enviam mensagens reais.
- **QA regressivo:** ampliar teste Chrome em 6 larguras, 12 páginas e verificações de comportamento da primeira dobra, link da história, contraste e contato desativado.

## Pendências que dependem de validação institucional
1. Fotografias reais autorizadas: salas, equipamentos, fachadas e equipe; não substituir por fotos inventadas ou imagens conceituais apresentadas como reais.
2. Endereços e horários oficiais de Diadema, Itavuvu, Anhanguera e eventuais outros espaços em atividade.
3. Marcos documentados dos dez anos (datas de expansão, acontecimentos relevantes, fontes e autorizações).
4. Configuração do provedor de e-mail e testes de envio/recebimento reais, segurança contra abuso em produção e monitoramento; a aplicação permanece com a integração desativada se as variáveis não estiverem disponíveis.
5. Revisão jurídica e de privacidade: responsável, contato LGPD, retenção, operadores e informações a divulgar.
6. Medição real de desempenho e acessibilidade (Core Web Vitals, Lighthouse/axe, navegação assistiva, contraste de todas as cores). As verificações atuais são parciais.
7. Consolidar seletivamente as quatro folhas de estilo, removendo regras antigas conflitantes após testes visuais comparativos. Não desativar o `noindex` até aprovação institucional.

## Publicação
Somente fazer merge após os testes GitHub Actions aprovados. Conferir separadamente o deployment correspondente à revisão, pois um commit em `main` não confirma publicação automática no Vercel.
