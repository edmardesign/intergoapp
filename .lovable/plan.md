# Plano de Implementação - Sprint de Mensagens (Recebimento e Acompanhamento)

Implementação do feed de mensagens recebidas, confirmação de leitura/recebimento, detalhe da mensagem e fluxo de acompanhamento para quem enviou.

## 1. Banco de Dados e Segurança
- Criar coluna `lido_em` na tabela `mensagem_destinatarios` (caso não exista, conferir tipos).
- Garantir RLS para que destinatários possam atualizar `confirmado_em` e `lido_em` de seus próprios registros.
- Criar função RPC para buscar mensagens recebidas com status de confirmação.

## 2. Server Functions (`src/lib/mensagens.functions.ts`)
- `getMensagensRecebidas`: Busca mensagens destinadas ao usuário atual, filtrando por "Hoje" e "Anteriores".
- `getMensagemDetalhe`: Busca dados completos de uma mensagem (remetente, anexos, status do destinatário atual).
- `confirmarRecebimento`: Atualiza `confirmado_em = now()` otimisticamente.
- `marcarComoLida`: Atualiza `lido_em = now()`.
- `getMensagensEnviadas`: Para gestores, lista mensagens enviadas com contadores de confirmação.
- `getAcompanhamentoEnvio`: Detalha quem confirmou e quem não confirmou uma mensagem específica.

## 3. UI - Tela de Início (`src/routes/inicio/index.tsx`)
- Refatorar para incluir as seções solicitadas:
  - Bloco de Pendências (expandido com contadores reais).
  - Faixa Urgente (alerta vermelho).
  - Seção "Precisa da sua Confirmação" (cards com botão inline).
  - Seção "Recebidas Hoje" (feed do dia).
  - Seção "Anteriores" (agrupamento por data e infinite scroll).
- Implementar animação de 250ms ao confirmar.
- Adicionar link "Ver mensagens que eu enviei" para gestores.

## 4. UI - Detalhe da Mensagem (`src/routes/inicio/msg/$id.tsx`)
- Layout completo com cabeçalho, assunto gigante, metadados do remetente.
- Blocos específicos para Demanda (prazo) e Reunião/Evento (local/data/hora).
- Gerador de arquivo ICS simples para calendário.
- Lista de anexos com URLs assinadas.

## 5. UI - Fluxo de Enviadas (`src/routes/enviadas/index.tsx` e `$id.tsx`)
- Lista compacta de envios com status X de Y confirmados.
- Detalhe do envio com abas "Confirmaram" e "Não confirmaram".
- Lógica de "Cobrar" com trava de 24h no localStorage.

## 6. Realtime
- Configurar `supabase.channel` para ouvir mudanças em `mensagens` e `mensagem_destinatarios`.
- Fallback para polling de 30s.

## Detalhes Técnicos
- Formatação de datas: `Intl.DateTimeFormat` com locale `pt-BR`.
- Fuso horário: `America/Sao_Paulo` forçado na lógica de agrupamento.
- Otimização: Cache do TanStack Query com invalidação via realtime.
