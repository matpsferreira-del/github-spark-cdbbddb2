import { Badge } from "@/components/ui/badge";
import type { Company } from "@/types/mentorship";

interface Props {
  tier: "A" | "B" | "C";
  companies: Company[];
}

const tierConfig = {
  A: {
    color: "bg-yellow-600",
    title: "Tier A — Grandes corporações e multinacionais",
    subtitle: "Empresas dos sonhos — mais difíceis de entrar, com as melhores oportunidades e remuneração.",
  },
  B: {
    color: "bg-blue-600",
    title: "Tier B — Empresas médias consolidadas",
    subtitle: "Empresas sólidas com boas oportunidades de crescimento e cultura forte.",
  },
  C: {
    color: "bg-green-600",
    title: "Tier C — Empresas estratégicas e startups",
    subtitle: "Portas de entrada estratégicas, startups e nichos com crescimento acelerado.",
  },
};

export default function CompanyTierSlide({ tier, companies }: Props) {
  const config = tierConfig[tier];

  if (companies.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12">
        <p className="text-muted-foreground">Nenhuma empresa neste tier. Gere o plano na aba Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <Badge className={config.color}>{tier[0]}</Badge>
          <p className="text-primary text-sm tracking-[0.2em] font-medium">MAPEAMENTO DE EMPRESAS</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-foreground">{companies.length}</p>
          <p className="text-muted-foreground text-xs">empresas</p>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-1">{config.title}</h2>
      <p className="text-muted-foreground text-sm mb-4">{config.subtitle}</p>

      <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
        <span>Progresso de abordagem</span>
        <span>{companies.filter(c => c.kanban_stage !== "identified").length}/{companies.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {companies.map((company) => (
          <div key={company.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-foreground font-semibold truncate">{company.name}</h3>
              <p className="text-muted-foreground text-xs truncate">{company.segment}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
