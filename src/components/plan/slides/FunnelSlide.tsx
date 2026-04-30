import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PlanSlideProps } from "../types";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Company } from "@/types/mentorship";

const stages = [
  { key: "identified", label: "Identificada" },
  { key: "connection_sent", label: "Convite" },
  { key: "connected", label: "Conectado" },
  { key: "message_sent", label: "Msg Enviada" },
  { key: "replied", label: "Respondeu" },
] as const;

const tierColors: Record<string, string> = {
  A: "bg-yellow-600",
  B: "bg-blue-600",
  C: "bg-green-600",
};

function CompanyCard({ company, isOverlay }: { company: Company; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: company.id, data: { stage: company.kanban_stage } });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors ${isOverlay ? "border-2 border-primary shadow-lg w-[170px]" : ""}`}
    >
      <div className="flex items-center justify-between mb-1 gap-1">
        <h4 className="text-foreground font-semibold text-xs md:text-sm truncate">{company.name}</h4>
        <Badge className={`${tierColors[company.tier] || "bg-muted"} text-white text-xs px-1.5 shrink-0`}>
          {company.tier}
        </Badge>
      </div>
      <p className="text-muted-foreground text-xs truncate">{company.segment}</p>
    </div>
  );
}

function StageColumn({ stageKey, label, companies }: { stageKey: string; label: string; companies: Company[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });

  return (
    <div className="flex-none w-[155px] md:flex-1 md:min-w-[155px]">
      <div className="flex items-center justify-between mb-2 gap-1">
        <h3 className="text-foreground font-semibold text-xs truncate">{label}</h3>
        <Badge variant="secondary" className="text-xs shrink-0">{companies.length}</Badge>
      </div>
      <SortableContext items={companies.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`space-y-2 min-h-[100px] rounded-lg p-2 transition-colors ${
            isOver ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"
          }`}
        >
          {companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <Building2 className="w-5 h-5 mb-1 opacity-30" />
              <p className="text-xs text-center">Arraste aqui</p>
            </div>
          ) : (
            companies.map((company) => <CompanyCard key={company.id} company={company} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function FunnelSlide({ companies, onRefreshData }: PlanSlideProps) {
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const moveCompany = async (companyId: string, newStage: string) => {
    const { error } = await supabase.from("companies").update({ kanban_stage: newStage }).eq("id", companyId);
    if (error) toast.error("Erro ao mover empresa");
    else onRefreshData();
  };

  const handleDragStart = (event: DragStartEvent) => {
    const company = companies.find(c => c.id === event.active.id);
    if (company) setActiveCompany(company);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCompany(null);
    const { active, over } = event;
    if (!over) return;
    const draggedCompany = companies.find(c => c.id === active.id);
    if (!draggedCompany) return;

    let targetStage: string | null = null;
    if (stages.some(s => s.key === over.id)) {
      targetStage = over.id as string;
    } else {
      const overCompany = companies.find(c => c.id === over.id);
      if (overCompany) targetStage = overCompany.kanban_stage;
    }

    if (targetStage && targetStage !== draggedCompany.kanban_stage) {
      moveCompany(draggedCompany.id, targetStage);
    }
  };

  if (companies.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 md:p-12">
        <p className="text-muted-foreground text-sm text-center">Nenhuma empresa mapeada. Gere o plano na aba Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <p className="text-primary text-sm tracking-[0.2em] font-medium mb-1">CONTROLE DE PROCESSO</p>
      <h2 className="text-xl md:text-3xl font-bold text-foreground mb-1">Funil de Empresas</h2>
      <p className="text-muted-foreground text-xs md:text-sm mb-1">
        {companies.length} empresas · Arraste os cards entre as colunas
      </p>
      <p className="text-muted-foreground text-xs mb-4 md:hidden">← Deslize para ver todas as colunas</p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Horizontal scroll on mobile for the kanban */}
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="flex gap-3 px-4 md:px-0 pb-3" style={{ minWidth: "min-content" }}>
            {stages.map((stage) => (
              <StageColumn
                key={stage.key}
                stageKey={stage.key}
                label={stage.label}
                companies={companies.filter(c => c.kanban_stage === stage.key)}
              />
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeCompany ? <CompanyCard company={activeCompany} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
