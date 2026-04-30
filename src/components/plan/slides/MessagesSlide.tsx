import { Button } from "@/components/ui/button";
import { Copy, Phone } from "lucide-react";
import { toast } from "sonner";
import type { PlanSlideProps } from "../types";

const templateLabels: Record<string, string> = {
  hr: "RH — QUANDO TEM VAGA ABERTA",
  hr_with_opening: "RH — QUANDO TEM VAGA ABERTA",
  hr_without_opening: "RH — QUANDO NÃO TEM VAGA",
  decision_maker: "DECISOR DA ÁREA — COM VAGA ABERTA",
  dm_with_opening: "DECISOR DA ÁREA — COM VAGA ABERTA",
  dm_without_opening: "DECISOR DA ÁREA — SEM VAGA",
  follow_up: "FOLLOW-UP (7 DIAS DEPOIS)",
  post_interview: "AGRADECIMENTO PÓS-ENTREVISTA",
};

export default function MessagesSlide({ templates }: PlanSlideProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Mensagem copiada!");
  };

  if (templates.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 md:p-12">
        <p className="text-muted-foreground">Nenhum template gerado. Gere o plano na aba Capa.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <p className="text-primary text-sm tracking-[0.2em] font-medium mb-1">SCRIPTS PRONTOS</p>
      <h2 className="text-xl md:text-3xl font-bold text-foreground mb-2">Mensagens para LinkedIn</h2>
      <p className="text-muted-foreground text-sm mb-1">
        Copie e personalize. Substitua os campos entre {"{ }"} pelos dados reais.{" "}
        <span className="text-primary font-medium">Sempre inclua seu telefone ao final.</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {templates.map((t) => (
          <div key={t.id} className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-foreground font-semibold text-xs tracking-wider uppercase">
                {templateLabels[t.type] || t.type}
              </h3>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(t.template)}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="p-4">
              <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{t.template}</p>
              <p className="text-primary font-medium text-sm mt-3">
                Segue meu contato: {"{seu telefone}"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-start gap-2 text-sm bg-card border border-border rounded-lg p-4">
        <Phone className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <span>
          <span className="text-destructive font-medium">Lembrete: </span>
          <span className="text-primary">Sempre deixe seu telefone/WhatsApp ao final de cada mensagem.</span>
        </span>
      </div>
    </div>
  );
}
