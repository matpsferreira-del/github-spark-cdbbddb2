import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Linkedin, FileText, Upload, CheckCircle2, Loader2, ClipboardList, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlanSlideProps } from "../types";
import type { CvDocument } from "@/types/mentorship";

const docTypes = [
  { type: "linkedin_pdf", label: "LinkedIn PDF", icon: Linkedin, iconColor: "text-primary", description: "Exporte seu perfil LinkedIn em PDF: Perfil → Mais → Salvar como PDF." },
  { type: "personal_cv", label: "CV Pessoal", icon: FileText, iconColor: "text-green-500", description: "Anexe o currículo pessoal atual do mentorado (PDF ou TXT)." },
  { type: "questionnaire", label: "Questionário", icon: ClipboardList, iconColor: "text-amber-500", description: "Questionário respondido pelo mentorado (opcional)." },
] as const;

export default function DocumentsSlide({ plan }: PlanSlideProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ["cv_documents", plan.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("cv_documents").select("*").eq("plan_id", plan.id);
      if (error) throw error;
      return data as CvDocument[];
    },
  });

  const handleUpload = async (docType: string, file: File) => {
    setUploading(docType);
    try {
      const filePath = `${plan.id}/${docType}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("cv-documents")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("cv-documents").getPublicUrl(filePath);

      // Delete existing doc of same type
      await supabase.from("cv_documents").delete().eq("plan_id", plan.id).eq("type", docType);

      const { error: dbError } = await supabase.from("cv_documents").insert({
        plan_id: plan.id,
        type: docType,
        file_name: file.name,
        file_url: urlData.publicUrl,
      });
      if (dbError) throw dbError;

      toast.success("Documento enviado!");
      queryClient.invalidateQueries({ queryKey: ["cv_documents", plan.id] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar documento");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (doc: CvDocument) => {
    try {
      const filePath = `${plan.id}/${doc.type}/${doc.file_name}`;
      await supabase.storage.from("cv-documents").remove([filePath]);
      await supabase.from("cv_documents").delete().eq("id", doc.id);
      toast.success("Documento removido");
      queryClient.invalidateQueries({ queryKey: ["cv_documents", plan.id] });
    } catch {
      toast.error("Erro ao remover documento");
    }
  };

  return (
    <div className="p-8">
      <p className="text-primary text-sm tracking-[0.2em] font-medium mb-1">DOCUMENTOS</p>
      <h2 className="text-3xl font-bold text-foreground mb-2">CVs do Mentorado</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Anexe documentos para que a IA use na análise e otimização do perfil LinkedIn.
      </p>

      <div className="grid grid-cols-3 gap-6">
        {docTypes.map(({ type, label, icon: Icon, iconColor, description }) => {
          const existingDoc = documents.find(d => d.type === type);
          return (
            <div key={type} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Icon className={`w-5 h-5 ${iconColor}`} />
                <h3 className="text-foreground font-bold">{label}</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-6">{description}</p>

              {existingDoc ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="truncate">{existingDoc.file_name}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive"
                    onClick={() => handleDelete(existingDoc)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Remover
                  </Button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept=".pdf,.txt,.doc,.docx"
                    className="hidden"
                    ref={el => { fileInputRefs.current[type] = el; }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(type, file);
                    }}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRefs.current[type]?.click()}
                    disabled={uploading === type}
                  >
                    {uploading === type ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Anexar {label}
                  </Button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
