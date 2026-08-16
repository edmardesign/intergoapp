import { createFileRoute } from "@tanstack/react-router";
import { SendFlowLayout } from "@/components/enviar/SendFlowLayout";

export const Route = createFileRoute("/enviar/$tipo/revisar")({
  component: RevisarPage,
});

function RevisarPage() {
  return (
    <SendFlowLayout step={3} title="Revisão">
      <p>Revisão final...</p>
    </SendFlowLayout>
  );
}
