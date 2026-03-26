

# Plano: Correções e melhorias no PlanPresentation

## Resumo das mudanças solicitadas

8 alterações organizadas em 3 blocos de trabalho.

---

## 1. Reestruturar abas (sidebar)

**Antes:** Capa, Diagnóstico, Tier A/B/C, Cargos, Perfil LinkedIn, Funil, Passo a Passo, Mensagens, Conteúdo, Cronograma, KPIs, Mapeamento, Documentos (15 abas)

**Depois:** Dashboard (Capa + KPIs juntos como aba 1, renomear para "Dashboard"), Diagnóstico, Tier A/B/C, Cargos, Perfil LinkedIn, Funil, Passo a Passo, Mensagens, Conteúdo, Cronograma, Mapeamento, Documentos (14 abas → 13 abas)

- Mesclar `CoverSlide` e `KpisSlide` num único `DashboardSlide` — mostra o card do mentorado no topo + métricas/KPIs abaixo + botão "Gerar Plano"
- Remover entrada "KPIs" do sidebar

---

## 2. Correções de UI nos slides existentes

### 2a. Funil — Kanban real sem scroll bar
- Remover `overflow-x-auto` e `overflow-y-auto` das colunas
- Implementar drag-and-drop com `@dnd-kit/core` + `@dnd-kit/sortable` para arrastar empresas entre colunas
- Manter botões Avançar/Voltar como fallback
- Adicionar badge visual de "Vagas Ativas" (ícone verde) quando `has_openings === true` no card da empresa
- Layout: colunas lado a lado com scroll natural da página

### 2b. Tier slides — Remover "vagas"
- Em `CompanyTierSlide`, remover o badge/texto de vagas ao lado das empresas

### 2c. Cronograma — Checkbox funcional
- O `ScheduleSlide` já tem lógica de `toggleActivity` mas o checkbox não funciona. Problema: o componente `Checkbox` do Radix precisa que `onCheckedChange` receba o novo valor. Corrigir para usar o callback corretamente e garantir que a mutação no Supabase funcione.

### 2d. Conteúdo — Prompts prontos para Gemini
- Substituir as "ideias genéricas" hardcoded por prompts completos gerados pela IA
- Cada prompt será um texto pronto para copiar/colar no Gemini, incluindo instruções de como formatar a publicação
- Adicionar botão "Copiar" em cada prompt
- A geração desses prompts será feita na edge function como parte do `type: "all"`

---

## 3. Upload de documentos + Perfil LinkedIn otimizado pela IA

### 3a. Documentos — Upload real de arquivos
- Criar bucket `cv-documents` no storage
- No `DocumentsSlide`, implementar upload funcional para 3 tipos:
  1. LinkedIn PDF
  2. CV Pessoal
  3. Questionário respondido (opcional)
- Salvar na tabela `cv_documents` com `type` expandido para incluir `questionnaire`
- Extrair texto dos PDFs via edge function (para alimentar a IA)

### 3b. Perfil LinkedIn — Otimização completa
- Expandir a edge function `generate-plan` para, quando houver texto extraído dos CVs, gerar uma análise completa do perfil LinkedIn:
  - Headline ideal
  - About/Resumo otimizado
  - Experiências (como descrever)
  - Competências recomendadas
  - Dicas por seção com explicação do porquê
- Armazenar no `general_notes` JSON (campo `linkedin_profile`)
- O `LinkedInProfileSlide` renderiza cada seção com o texto ideal + explicação

### 3c. Edge function — Gerar tudo de uma vez
- Garantir que `type: "all"` chama TODAS as gerações (companies, job_titles, messages, schedule, diagnosis, content_prompts, linkedin_profile)
- Adicionar geração de `content_prompts` (8-10 prompts prontos para Gemini)
- Armazenar `content_prompts` e `linkedin_profile` dentro do JSON de `general_notes`

---

## Detalhes técnicos

### Arquivos a criar/editar:
| Arquivo | Ação |
|---|---|
| `src/components/plan/slides/DashboardSlide.tsx` | Novo — merge de Cover + KPIs |
| `src/components/plan/slides/CoverSlide.tsx` | Remover |
| `src/components/plan/slides/KpisSlide.tsx` | Remover |
| `src/components/plan/slides/FunnelSlide.tsx` | Reescrever com dnd-kit + flag vagas |
| `src/components/plan/slides/CompanyTierSlide.tsx` | Remover badge de vagas |
| `src/components/plan/slides/ScheduleSlide.tsx` | Fix checkbox toggle |
| `src/components/plan/slides/ContentSlide.tsx` | Prompts prontos da IA + botão copiar |
| `src/components/plan/slides/LinkedInProfileSlide.tsx` | Reescrever para perfil completo |
| `src/components/plan/slides/DocumentsSlide.tsx` | Upload funcional (3 tipos) |
| `src/pages/PlanPresentation.tsx` | Atualizar slides array, remover KPIs |
| `src/components/plan/types.ts` | Adicionar tipos para content_prompts e linkedin_profile |
| `supabase/functions/generate-plan/index.ts` | Adicionar gerações de content_prompts |
| Migration SQL | Criar bucket `cv-documents`, expandir cv_documents.type constraint |
| `package.json` | Adicionar `@dnd-kit/core` e `@dnd-kit/sortable` |

### Dependência nova:
- `@dnd-kit/core` + `@dnd-kit/sortable` para drag-and-drop no Kanban

