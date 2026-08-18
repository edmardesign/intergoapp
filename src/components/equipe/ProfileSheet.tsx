import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User, Phone, MapPin, Building, Briefcase, FileText } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { aprovarCadastro, negarCadastro } from "@/lib/equipe.functions";
import { toast } from "sonner";

interface ProfileSheetProps {
  perfil: any | null;
  onClose: () => void;
  onUpdate: () => void;
  canApprove: boolean;
}

export function ProfileSheet({ perfil, onClose, onUpdate, canApprove }: ProfileSheetProps) {
  const [showNegar, setShowNegar] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  
  const aprovar = useServerFn(aprovarCadastro);
  const negar = useServerFn(negarCadastro);

  if (!perfil) return null;

  const handleAprovar = async () => {
    setLoading(true);
    try {
      await aprovar({ data: { perfil_id: perfil.id } });
      toast.success("Acesso liberado com sucesso!");
      onUpdate();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao aprovar");
    } finally {
      setLoading(false);
    }
  };

  const handleNegar = async () => {
    if (!motivo.trim()) {
      toast.error("Motivo é obrigatório");
      return;
    }
    setLoading(true);
    try {
      await negar({ data: { perfil_id: perfil.id, motivo } });
      toast.success("Cadastro negado");
      onUpdate();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao negar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={!!perfil} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-6 overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="w-12 h-1 bg-muted mx-auto rounded-full mb-4" />
          <SheetTitle className="text-2xl font-bold text-center">Dados do Perfil</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <User size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold">{perfil.nome_completo}</h3>
              <p className="text-secondary">{perfil.cargo_nome}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem icon={<FileText />} label="CPF" value={perfil.cpf} />
            <InfoItem icon={<Phone />} label="Telefone" value={perfil.telefone} />
            <InfoItem icon={<Building />} label="Unidades" value={perfil.unidades?.join(", ") || "Sem lotação"} />
            <InfoItem icon={<MapPin />} label="Endereço" value={`${perfil.logradouro || ""}, ${perfil.numero || ""}${perfil.complemento ? ` - ${perfil.complemento}` : ""}, ${perfil.bairro || ""}, ${perfil.cep}`} />
          </div>

          {perfil.status === "pendente" && canApprove && (
            <div className="pt-6 space-y-4">
              {!showNegar ? (
                <div className="flex flex-col gap-3">
                  <Button 
                    className="w-full h-14 rounded-2xl text-lg font-bold bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleAprovar}
                    disabled={loading}
                  >
                    Liberar acesso
                  </Button>
                  <Button 
                    variant="ghost"
                    className="w-full h-14 rounded-2xl text-lg font-bold text-destructive hover:bg-destructive/10"
                    onClick={() => setShowNegar(true)}
                    disabled={loading}
                  >
                    Negar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary">Motivo da negativa (obrigatório)</label>
                    <Textarea 
                      placeholder="Descreva o motivo..." 
                      className="min-h-[100px] rounded-2xl"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      className="flex-1 h-12 rounded-xl"
                      onClick={() => setShowNegar(false)}
                      disabled={loading}
                    >
                      Voltar
                    </Button>
                    <Button 
                      className="flex-1 h-12 rounded-xl bg-destructive hover:bg-destructive/90 text-white"
                      onClick={handleNegar}
                      disabled={loading}
                    >
                      Confirmar Negativa
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex gap-3 items-start p-3 bg-card border border-border rounded-xl">
      <div className="text-primary mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-secondary font-medium uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
