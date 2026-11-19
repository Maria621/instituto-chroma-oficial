# Instituto Chroma — Direção Institucional Premium V7

## Decisão de produto
Combinar a presença visual da V1 (hero cinematográfico, grafismos azuis, narrativa mais rica) com a clareza estrutural da V2 (componentes interativos, linha do tempo, arquitetura direta). A V7 preserva os projetos práticos da Chroma e reduz o ruído informacional entre áreas.

## Mudanças implementadas
- Home: hero e identidade da V1 preservados; galeria com leve recorte diagonal inspirado na V2; projetos práticos (programação, Roblox e empresa simulada) separados de campanhas Presença Premiada e Consciência Negra. Cada cartão tem um destino.
- Trajetória: linha do tempo navegável de iniciativas documentadas de 2026, com abas, atributos ARIA, setas e teclado. Conteúdos permanecem acessíveis sem JavaScript. A cronologia de fundação e expansão ainda precisa de dados verificados.
- Metodologia: percurso com cinco etapas, incluindo fechamento com explicação do professor na lousa e aplicação no computador conforme a atividade.
- Contato: removidos dois convites redundantes; backend de e-mail intocado nesta entrega.
- Unidades: identificação da Anhanguera com o mesmo canal de atendimento da Itavuvu, sem inventar endereço.
- Rodapé: HTML idêntico nas 12 páginas, compacto, com links agrupados, Instagram e um único caminho de atendimento.
- Confiança: imagens conceituais identificadas como tal; artes de campanhas inteiras; logotipos intactos.
- Manutenção: novos estilos na camada existente quality.css; timeline.js isolado e carregado somente na página de história.
- Testes: CI e validação estática para o novo script, componentes, links e rodapé.

## Antes da publicação definitiva
- Confirmar marcos históricos da primeira década da escola para construir a cronologia completa.
- Substituir imagens conceituais por fotos reais autorizadas das unidades.
- Validar todos os endereços e horários, inclusive Anhanguera.
- Configurar e testar o envio de e-mail do formulário.
- Inspecionar o layout e as interações em navegadores reais e vários tamanhos de tela.
- Preservar noindex até validação editorial, jurídica e de privacidade.

## Critérios de qualidade
Links internos válidos, componentes realmente funcionais, foco/teclado acessíveis, conteúdo específico por página, imagens com identificação correta, commit em branch separada e CI antes da produção.