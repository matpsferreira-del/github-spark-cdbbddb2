import { Puzzle, Download, LogIn, Linkedin, Rocket } from "lucide-react";

type Step = {
  icon: React.ElementType;
  title: string;
  description: string;
  steps: string[];
  badge: { label: string; className: string };
};

const STEPS: Step[] = [
  {
    icon: Download,
    title: "Baixe e instale",
    description: "Adicione a extensão ao seu Chrome em menos de 1 minuto",
    steps: [
      "Receba a pasta pathly-extension pelo seu mentor",
      "No Chrome, acesse chrome://extensions",
      "Ative o Modo do desenvolvedor (canto superior direito)",
      "Clique em \"Carregar sem compactação\" e selecione a pasta",
      "Clique no ícone 🧩 e fixe a extensão na barra",
    ],
    badge: {
      label: "✅ Gratuito · Sem loja necessária",
      className: "bg-green-500/10 text-green-500 border-green-500/30",
    },
  },
  {
    icon: LogIn,
    title: "Conecte sua conta",
    description: "Use o mesmo email e senha do Pathly",
    steps: [
      "Clique no ícone da extensão na barra do Chrome",
      "Digite seu email e senha do Pathly",
      "Clique em Entrar",
      "Você verá a confirmação de login",
    ],
    badge: {
      label: "🔒 Login feito uma única vez",
      className: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    },
  },
  {
    icon: Linkedin,
    title: "Salve perfis",
    description: "Abra qualquer perfil e salve com 1 clique",
    steps: [
      "Acesse um perfil no LinkedIn (linkedin.com/in/...)",
      "Aguarde o botão \"🚀 Salvar no Pathly\" aparecer no canto inferior direito",
      "Clique no botão — a IA analisa o perfil automaticamente",
      "Confirme nome, cargo e empresa no formulário",
      "Clique em Salvar — o contato aparece no seu Mapeamento",
    ],
    badge: {
      label: "⚡ Powered by IA",
      className: "bg-primary/10 text-primary border-primary/30",
    },
  },
];

export default function ExtensionGuideSlide() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
          <Puzzle className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-primary text-sm tracking-[0.2em] font-medium mb-1">EXTENSÃO</p>
          <h2 className="text-3xl font-bold text-foreground mb-1">Extensão do Chrome</h2>
          <p className="text-muted-foreground text-sm">
            Salve perfis do LinkedIn direto no seu plano com 1 clique
          </p>
        </div>
      </div>

      {/* Step cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {STEPS.map(({ icon: Icon, title, description, steps, badge }, idx) => (
          <div
            key={idx}
            className="bg-card border border-border rounded-xl p-6 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-bold text-muted-foreground tracking-wider">
                ETAPA {idx + 1}
              </span>
            </div>
            <h3 className="text-foreground font-bold text-lg mb-1">{title}</h3>
            <p className="text-muted-foreground text-sm mb-5">{description}</p>

            <ol className="space-y-2.5 mb-5 flex-1">
              {steps.map((step, sIdx) => (
                <li key={sIdx} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {sIdx + 1}
                  </span>
                  <span className="text-foreground text-sm leading-snug">{step}</span>
                </li>
              ))}
            </ol>

            <div
              className={`text-xs font-medium px-3 py-1.5 rounded-full border inline-block w-fit ${badge.className}`}
            >
              {badge.label}
            </div>
          </div>
        ))}
      </div>

      {/* Mock browser preview */}
      <div>
        <h3 className="text-foreground font-bold mb-3 text-base">Veja como aparece</h3>
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
          {/* Browser chrome */}
          <div className="bg-secondary border-b border-border px-4 py-2.5 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <div className="flex-1 bg-background border border-border rounded-md px-3 py-1 text-xs text-muted-foreground font-mono">
              linkedin.com/in/nome-da-pessoa
            </div>
            <Puzzle className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Fake LinkedIn page */}
          <div className="relative bg-muted/30 h-72 p-6">
            <div className="space-y-3 max-w-md">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="w-40 h-3 bg-muted rounded" />
                  <div className="w-28 h-2.5 bg-muted/70 rounded" />
                </div>
              </div>
              <div className="space-y-2 pt-3">
                <div className="w-full h-2 bg-muted/60 rounded" />
                <div className="w-5/6 h-2 bg-muted/60 rounded" />
                <div className="w-4/6 h-2 bg-muted/60 rounded" />
              </div>
              <div className="space-y-2 pt-3">
                <div className="w-24 h-2.5 bg-muted rounded" />
                <div className="w-full h-2 bg-muted/60 rounded" />
                <div className="w-3/4 h-2 bg-muted/60 rounded" />
              </div>
            </div>

            {/* Arrow pointing to button */}
            <div className="absolute bottom-20 right-24 flex items-center gap-2 animate-pulse">
              <span className="text-primary text-xs font-semibold whitespace-nowrap">
                Clique aqui →
              </span>
            </div>

            {/* Floating extension button */}
            <button
              type="button"
              className="absolute bottom-5 right-5 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary/70 text-primary-foreground font-semibold text-sm shadow-xl hover:shadow-2xl transition-shadow cursor-default"
            >
              <Rocket className="w-4 h-4" />
              Salvar no Pathly
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
