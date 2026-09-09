# Corrigir envio por hierarquia municipal completa

## Objetivo
Trocar a dependência de subordinados previamente cadastrados por destinatários definidos pela hierarquia de cargos. Assim, qualquer pessoa poderá preparar e enviar comunicações aos cargos abaixo dela; profissionais já cadastrados recebem imediatamente e os que entrarem depois recebem as mensagens pendentes destinadas ao cargo.

## 1. Padronizar o plano hierárquico
- Consolidar uma cadeia municipal comum: Prefeito → Secretário → Direção/Coordenação → Chefias locais → equipes operacionais.
- Completar os cargos típicos de todas as secretarias oferecidas no cadastro: Saúde, Educação, Assistência Social, Finanças/Fazenda, Obras e Infraestrutura, Administração, Meio Ambiente, Cultura e Esporte e secretaria personalizada.
- Definir `cargo_superior_id`, escopo e permissão de envio para cada cargo, sem depender de nomes exatos digitados pelo usuário.
- Manter compatibilidade com a coluna legada `perfis.nivel_id`; não executar a migração ampla `nivel_id → cargo_id`.

## 2. Destinatários por cargo, mesmo sem cadastro
- Criar uma relação segura entre mensagem e cargos destinatários abaixo do remetente.
- Ao enviar para “Todos abaixo de você”, registrar todos os cargos descendentes da cadeia, além dos perfis atualmente existentes.
- Quando um novo perfil ativo for criado, entregar automaticamente as mensagens pendentes destinadas ao cargo dele.
- Evitar duplicidade de entrega e manter as regras de leitura/confirmação existentes.

## 3. Corrigir o envio no aplicativo
- Remover a tela vazia que afirma não haver subordinados.
- Exibir cargos abaixo do usuário mesmo quando ainda não existem pessoas cadastradas, diferenciando “cargo” de “pessoa”.
- Em seleção por pessoas, mostrar somente cadastrados; em “Todos” e “Cargo”, incluir também futuros ocupantes.
- Ajustar o envio rápido e o fluxo de comunicado/demanda/reunião/evento para usar a mesma regra hierárquica.

## 4. Segurança e consistência
- Aplicar RLS e GRANTs na nova relação de destinatários por cargo.
- Validar no banco que o remetente só pode escolher cargos realmente abaixo do próprio cargo e dentro do mesmo município/secretaria aplicável.
- Impedir envio para o próprio cargo ou para cargos superiores.
- Preservar mensagens e destinatários já existentes.

## 5. Verificação
- Testar perfis de Prefeito, Secretário, Diretor/Coordenador e cargo operacional.
- Confirmar envio imediato para usuários já cadastrados.
- Confirmar entrega retroativa ao cadastrar posteriormente um profissional em cargo previamente destinatário.
- Confirmar que a aba Enviar nunca fica bloqueada pela ausência de cadastros e que cargos sem subordinados reais mostram corretamente que não há cargo inferior.
- Validar no celular a seleção, revisão, envio e recebimento sem sobreposição ou texto truncado.

## Detalhes técnicos
- Uma única migração criará/completará a árvore de cargos, a tabela de destinos por cargo, funções recursivas e o gatilho de entrega futura.
- O frontend continuará usando o banco atual e a coluna `nivel_id`, evitando a migração destrutiva de hierarquia já adiada.
- “Professor” normalmente é cargo final na Educação; ele poderá enviar apenas se houver funções formalmente abaixo dele na cadeia configurada. O aplicativo não inventará subordinados pessoais inexistentes, mas não exigirá cadastro prévio dos ocupantes dos cargos inferiores.
