

# Plano: Cidades múltiplas + Acesso do mentorado

## 1. Localização — Permitir múltiplas cidades sempre

**Problema:** O campo de adicionar cidades extras só aparece quando `regionPreference === "open_to_change"`.

**Solução:** Em `CreatePlan.tsx`, mover o bloco de "Cidades Disponíveis" para fora do condicional `regionPreference === "open_to_change"`. Sempre exibir a seção de adicionar cidades (estado + cidade + botão "+"), independente da preferência de região. Renomear o label para "Cidades de Interesse" para ficar mais claro. Manter o campo de Estado/Cidade principal como a localização atual do mentorado, e as cidades adicionais como cidades onde ele aceita trabalhar.

## 2. Acesso do mentorado — Já implementado

O sistema de link para mentorado **já está implementado**:

- **Rota:** `/mentee/:token` → `MenteeView.tsx`
- **Geração do link:** Botão "Link Mentorado" em `PlanPresentation.tsx` cria um token na tabela `plan_access_tokens` e copia o URL
- **RLS:** Todas as tabelas já têm policies permitindo SELECT/UPDATE/INSERT via `plan_access_tokens`
- **Flag `isMentee`:** O `MenteeView` já passa `isMentee={true}` para os slides, que esconde os botões de IA

**Se o link não está funcionando**, o problema pode ser de runtime. Vou verificar e corrigir qualquer erro no `MenteeView.tsx` durante a implementação.

## Arquivos a editar

| Arquivo | Mudança |
|---|---|
| `src/pages/CreatePlan.tsx` | Remover condicional `regionPreference === "open_to_change"` do bloco de cidades extras |

