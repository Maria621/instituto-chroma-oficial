# Etapa 2 — Funcionalidades críticas e segurança de contato (V13)

## Alterações aplicadas

- **Indisponibilidade segura:** sem integração aprovada, o visitante vê o canal de Instagram e não é convidado a preencher campos que não podem ser enviados. O `noindex` permanece.
- **Pré-condições do formulário:** não basta cadastrar a chave de e-mail. A API só informa `acceptingMessages: true` se o serviço de e-mail, o Cloudflare Turnstile (site key e secret key), a origem autorizada e a aprovação institucional de privacidade estiverem configurados.
- **Controle do cliente isolado:** `contact.js` é carregado somente por `contato.html`. `app.js` não gerencia mais o formulário. Erros de rede e do desafio deixam o envio desabilitado ou exibem fallback.
- **Verificação anti-automação:** `cf-turnstile-response` obrigatório; o backend usa a API Siteverify, valida `success`, `hostname` e `action`. Tokens não são aceitos apenas por sua presença no navegador.
- **Origem e validação:** a API exige `Origin` igual à origem cadastrada e JSON, limita o tamanho do corpo, valida campos, formato de e-mail, consentimento e comprimentos; rejeita conteúdo suspeito em campos pessoais de linha única.
- **Resultado honesto:** não mostra confirmação antes de o provedor Resend aceitar a solicitação e retornar um ID de e-mail; não afirma que a mensagem já foi entregue na caixa de entrada.
- **Aviso de privacidade:** minuta atualizada para descrever o tratamento técnico do Turnstile e as condições necessárias à ativação. Ainda precisa de revisão jurídica/institucional.

## Variáveis de ambiente necessárias (Vercel)

Veja `.env.example`. Configurar **somente no ambiente do Vercel**, não em commit público:

| Variável | Uso |
|---|---|
| `RESEND_API_KEY` | API de e-mail |
| `CONTACT_TO_EMAIL` | Caixa de entrada da escola |
| `CONTACT_FROM_EMAIL` | Remetente de domínio autenticado no Resend |
| `TURNSTILE_SITE_KEY` | Identificador público do widget |
| `TURNSTILE_SECRET_KEY` | Chave privada de validação no servidor |
| `CONTACT_ALLOWED_ORIGIN` | `https://instituto-chroma-oficial.vercel.app` ou domínio oficial em uso, sem barra final |
| `CONTACT_PRIVACY_APPROVED` | `true` **somente após aprovação institucional e jurídica**. Valor padrão: `false` |

**Não modificar `CONTACT_PRIVACY_APPROVED` para contornar a revisão.** A versão está pronta para integração futura, mas **não foi ativada nem testada com envio real**. Os testes atuais usam mocks, não chaves privadas.

## Fluxo de liberação

1. Conferir e aprovar a versão final do aviso de privacidade: agente de tratamento, operador Turnstile/Resend, base legal aplicável, retenção e canal de exercício dos direitos.
2. Validar domínio, e-mail remetente autenticado no Resend, caixa destinatária e condições da edição no Vercel.
3. Criar widget Turnstile para o hostname oficial, registrar site key e secret key correspondentes.
4. Configurar todas as variáveis no Vercel **sem expor os segredos ao navegador**. Somente a site key é pública.
5. Ativar `CONTACT_PRIVACY_APPROVED=true` depois da revisão.
6. Publicar, verificar `GET /api/contato`, completar um desafio legítimo e enviar uma mensagem de teste autorizada. Conferir entrega real na caixa de entrada, não apenas HTTP 200.
7. Simular erros: formulário indisponível, desafio expirado, falha do e-mail, campo obrigatório, rede offline e tentativas repetidas.
8. Ativar proteção adicional de taxa por IP/rota na camada de borda ou armazenamento compartilhado, com análise de custo. **Não existe limitação persistente de requisições nesta implementação**; Turnstile e honeypot ajudam contra automação, mas não são substitutos completos para WAF/rate limiting.
9. Manter logging sem mensagens nem PII; acompanhar falhas e políticas de retenção.

## Verificações automáticas

- `node tests/contact-api.test.mjs` simula chave ausente, aprovação ausente, origem incorreta, dados inválidos, CAPTCHA falso/expirado, falha do serviço externo e sucesso do Resend.
- `node tests/browser-layout.mjs` mantém validação de 12 páginas em 9 larguras e acrescenta cenário de contato habilitado com Turnstile e API simulados, incluindo falha e recuperação.
- `node tests/validate-site.mjs` verifica se `contact.js` é isolado da navegação geral e se a API mantém a proteção obrigatória.
- `tests/visual-review.mjs` compara o visual com a versão anterior.

### Limites conhecidos

Sem autorização institucional, **não é seguro ativar o formulário nem a coleta de dados**. O botão alternativo leva apenas ao Instagram oficial. Esta etapa prepara e protege o código, não garante entrega de e-mail, segurança absoluta, revisão jurídica final ou proteção de taxa na infraestrutura.

Referências: documentação oficial Cloudflare Turnstile e API Resend.
