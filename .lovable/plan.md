# Plano de Implementação - Lumina Onboarding

Este plano detalha a criação do fluxo de onboarding do aplicativo Lumina, um sistema de comunicação hierárquica para prefeituras, focado na experiência mobile-first e integração com o backend Lovable Cloud.

## 1. Configuração do Ambiente e Design System

- Configurar variáveis de cores e tokens no `src/styles.css` (Tailwind v4 inline theme).
- Definir tipografia e espaçamentos baseados na grade de 4px.
- Configurar animações de transição de tela.

## 2. Estrutura de Dados e Backend

### Tabelas do Banco de Dados
- Criar a tabela `waitlist` (id, email, estado_id, cidade_texto, criado_em).
- As demais tabelas já estão configuradas conforme o contexto: `estados`, `municipios`, `secretarias`, `niveis`, `unidades`, `perfis`.
- Configurar políticas RLS para permitir a inserção de novos perfis durante o onboarding.

### Estado da Aplicação
- Implementar `useOnboardingStore` com Zustand para gerenciar o estado dos 16 passos.
- Adicionar persistência automática no `localStorage` (chave `onboarding_v1`).

## 3. Fluxo de Onboarding (16 Telas)

### Componente de Layout Base
- Barra de progresso fixa (16 passos).
- Botão "Voltar" discreto no topo.
- Botão principal fixo na base (52px altura, estados habilitado/desabilitado).

### Detalhamento dos Passos
1.  **Abertura**: Logo, CTA e link para Login.
2.  **Estado**: Busca e lista de UFs.
3.  **Cidade**: Filtro por `estado_id` e `ativo: true`. Lógica de Waitlist se lista vazia.
4.  **Secretaria**: Cards com ícones das secretarias do município.
5.  **Cargo**: Cards de níveis ordenados por `ordem ASC`.
6.  **Local de Trabalho**: Condicional a `niveis.tem_unidade`.
7.  **Superior Direto**: Título dinâmico, busca em `perfis_publicos_min`. Lógica de pré-preenchimento ou fallback para Prefeito.
8.  **Nome Completo**: Input com auto-capitalização.
9.  **CPF**: Máscara e validação de dígito verificador.
10. **Telefone**: Máscara de celular brasileiro.
11. **CEP**: Máscara e integração com API ViaCEP para preenchimento de endereço.
12. **Número e Complemento**: Campos de endereço.
13. **E-mail**: Validação de formato.
14. **Senha**: Mínimo 8 caracteres com medidor de força.
15. **Conferência**: Resumo com botões de edição rápida.
16. **Status Pendente**: Tela de espera com feedback do superior responsável.

## 4. Integração com Auth e Perfis

- Implementar função de submissão final:
    - `signUp` no Auth do Lovable Cloud.
    - `insert` na tabela `perfis` com `status: 'pendente'`.
    - Limpeza do rascunho.
- Implementar redirecionamentos inteligentes:
    - Se logado e pendente -> Tela 16.
    - Se logado e ativo -> `/inicio`.
    - Se negado -> Tela de erro com motivo.

## Detalhes Técnicos

- **Navegação**: TanStack Router para rotas internas do onboarding.
- **Formulários**: React Hook Form + Zod para validações em tempo real.
- **Componentes UI**: Extensão dos componentes Shadcn existentes com os tokens de design específicos do Lumina.
- **Transições**: Animações CSS personalizadas para o efeito de "deslizar da direita".

---
**Nota**: Este sprint foca exclusivamente no onboarding e status de aprovação. Funcionalidades de mensagens e dashboards serão implementadas em etapas futuras.