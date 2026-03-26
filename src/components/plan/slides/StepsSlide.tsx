import { Sparkles, Clock } from "lucide-react";
import { parseDiagnosisData } from "../types";
import type { PlanSlideProps } from "../types";

const defaultSteps = [
  { step: 1, title: "Abertura e Organização", description: "Abra o LinkedIn no seu navegador ou aplicativo. Tenha ao lado sua planilha de controle de empresas (Tier A, B, C) e um bloco de notas para anotações rápidas. A organização é fundamental para a eficiência.", tip: "Sempre comece o dia revisando suas metas e a lista de empresas que você irá abordar. Isso te dará foco.", time: "5 minutos" },
  { step: 2, title: "Navegar para a Empresa-Alvo", description: "Na barra de busca do LinkedIn, digite o nome da primeira empresa da sua lista (comece pelas Tier A). Clique no perfil oficial da empresa para acessá-lo.", tip: "Certifique-se de que está no perfil oficial da empresa, e não em um perfil de funcionário ou página de grupo.", time: "1 minuto por empresa" },
  { step: 3, title: "Verificar Vagas Abertas", description: "Dentro da página da empresa, procure e clique na aba 'Vagas' (ou 'Jobs'). Esta aba lista todas as posições abertas que a empresa divulgou no LinkedIn.", tip: "Algumas empresas podem ter vagas em outras plataformas. O LinkedIn é o ponto de partida, mas se a empresa tiver um portal de carreiras, vale a pena verificar também.", time: "2 minutos por empresa" },
  { step: 4, title: "Candidatura e Mensagem (Se Houver Vaga)", description: "Se encontrar uma vaga relevante, leia a descrição com atenção. Clique em 'Candidatar-se' (ou 'Easy Apply'). Após a candidatura, procure por um contato de RH ou do gestor da área (passo 6) e envie uma mensagem personalizada mencionando sua candidatura.", tip: "Mesmo em 'Easy Apply', tente anexar uma carta de apresentação personalizada se houver a opção. Isso te destaca.", time: "10-15 minutos por vaga" },
  { step: 5, title: "Buscar Funcionários (Se Não Houver Vaga ou para Networking)", description: "Se não houver vagas abertas ou se você já se candidatou e quer ir além, volte à página principal da empresa e clique na aba 'Pessoas' (ou 'Funcionários'). Esta seção mostra os colaboradores da empresa.", tip: "Esta é a sua mina de ouro para networking. Não se limite apenas a vagas, mas a construir relacionamentos.", time: "1 minuto por empresa" },
  { step: 6, title: "Filtrar e Conectar com Decisores e RH", description: "Use os filtros da aba 'Pessoas' para encontrar profissionais relevantes. Busque por cargos como Gerente de RH, Head de Talent Acquisition, ou gestores da sua área. Envie convites de conexão personalizados.", tip: "Priorize sempre decisores da área e RH. Uma conexão bem feita vale mais que 100 conexões aleatórias.", time: "3-5 minutos por contato" },
  { step: 7, title: "Registrar e Acompanhar", description: "Após cada abordagem, registre no seu controle: empresa abordada, tipo de contato, status da conexão. Isso permite acompanhar o progresso e fazer follow-ups estratégicos.", tip: "Use a aba 'Funil' e 'Mapeamento' deste plano para registrar tudo e manter o controle.", time: "2 minutos" },
];

export default function StepsSlide({ plan }: PlanSlideProps) {
  const data = parseDiagnosisData(plan.general_notes);
  const steps = data.steps || defaultSteps;

  return (
    <div className="p-8">
      <p className="text-primary text-sm tracking-[0.2em] font-medium mb-1">TUTORIAL DIÁRIO</p>
      <h2 className="text-3xl font-bold text-foreground mb-2">Passo a Passo no LinkedIn</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Siga estes passos todos os dias. Cada etapa está detalhada para executar mesmo sem experiência prévia.
      </p>

      <div className="space-y-4">
        {steps.map((item) => (
          <div key={item.step} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-primary-foreground font-bold text-sm">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-foreground font-semibold mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-xs shrink-0">
                <Clock className="w-3 h-3" />
                <span>{item.time}</span>
              </div>
            </div>
            {item.tip && (
              <div className="mt-3 ml-12 flex items-start gap-2 text-primary text-sm">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Dica: {item.tip}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
