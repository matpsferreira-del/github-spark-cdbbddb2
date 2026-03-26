import { Button } from "@/components/ui/button";
import { Linkedin, FileText, Upload } from "lucide-react";
import type { PlanSlideProps } from "../types";

export default function DocumentsSlide({ plan }: PlanSlideProps) {
  return (
    <div className="p-8">
      <p className="text-primary text-sm tracking-[0.2em] font-medium mb-1">DOCUMENTOS</p>
      <h2 className="text-3xl font-bold text-foreground mb-2">CVs do Mentorado</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Anexe o LinkedIn PDF e/ou CV pessoal para que a IA use na análise de perfil.
      </p>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Linkedin className="w-5 h-5 text-primary" />
            <h3 className="text-foreground font-bold">LinkedIn PDF</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            Exporte seu perfil LinkedIn em PDF: Perfil → Mais → Salvar como PDF.
          </p>
          <Button variant="outline" className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            Anexar LinkedIn PDF
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-5 h-5 text-green-500" />
            <h3 className="text-foreground font-bold">CV Pessoal</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            Anexe o currículo pessoal atual do mentorado (PDF ou TXT).
          </p>
          <Button variant="outline" className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            Anexar CV Pessoal
          </Button>
        </div>
      </div>
    </div>
  );
}
