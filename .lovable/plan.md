# Plan: Approval Flow Implementation

Build the "Equipe" feature for INTERGO, allowing superiors to review and approve/deny pending registrations from their direct subordinates.

## User Review Required

> [!IMPORTANT]
> The current database schema for `perfis` needs new columns: `aprovado_por` (UUID) and `aprovado_em` (TIMESTAMPTZ). I will add these via migration.
> I will also implement the `perfis_subarvore(superior_id_root UUID)` function in PostgreSQL to support the hierarchy view.

## Proposed Changes

### Database & Security (Supabase Engineer)
- **Migration**: Add `aprovado_por`, `aprovado_em`, and `motivo_negativa` to `perfis`.
- **Function**: Create `perfis_subarvore` to return recursive subordinates.
- **RLS**: Update policies on `perfis` to allow `UPDATE status` only if `auth.uid() = superior_id`.

### Server Functions (API Integrator)
- **src/lib/equipe.functions.ts**:
    - `getEquipePendentes`: Fetch direct subordinates with status 'pendente'.
    - `getEquipeAtivos`: Fetch sub-tree subordinates with status 'ativo'.
    - `getEquipeInativos`: Fetch sub-tree subordinates with status 'negado' or 'inativo'.
    - `aprovarPerfil`: Set status to 'ativo'.
    - `negarPerfil`: Set status to 'negado' + reason.
    - `reativarPerfil`: Reset status to 'ativo'.

### UI Components (UI Architect)
- **BottomNavigation**: Persistent bar with conditional tabs (3 for Professor, 5 for others).
- **EquipeTabs**: Segmented control for Ativos/Pendentes/Inativos.
- **ProfileSheet**: Approval/Detail bottom sheet with formatting for CPF/Telefone.
- **PendingNotification**: Card for the Inicio screen showing pending counts.

### Routes & Integration
- **src/routes/equipe.tsx**: Main route for the team management.
- **src/routes/inicio/index.tsx**: Add pending notification card.
- **src/routes/__root.tsx**: Wrap outlet with `BottomNavigation` (excluding login/onboarding).

## Technical Details
- **Hierarchy Logic**: Superior status determined by `nivel.ordem < 2` (Professor is order 3 in Education, but generally "Professor" will be the role name check or a metadata flag).
- **Transitions**: 200ms smooth transitions for tab switching.
- **Validation**: "Motivo recusa" requires 10+ characters.
- **Formatting**: CPF (000.000.000-00), Telefone ((00) 00000-0000).
- **Empty States**: Illustrated text for zero items.
- **Error Handling**: Toast notifications (Sonner) for RLS/Permission errors.
