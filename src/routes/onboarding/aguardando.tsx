import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/onboarding/aguardando')({
  component: () => <div>Aguardando aprovação</div>
})
