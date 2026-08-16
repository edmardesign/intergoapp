import { createFileRoute } from "@tanstack/react-router";
import { SendFlowLayout } from "@/components/enviar/SendFlowLayout";

export const Route = createFileRoute("/enviar/$tipo/destinatarios")({
  component: DestinatariosPage,
});

function DestinatariosPage() {
  return (
    <SendFlowLayout step={2} title="Destinatários">
      <p>Seleção de destinatários...</p>
    </SendFlowLayout>
  );
}
