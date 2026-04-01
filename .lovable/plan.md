

## Plano: Autenticação de Mentorado + Extensão Chrome para LinkedIn

### Contexto

Hoje o mentorado acessa via link com token (`/mentee/:token`). Vamos migrar para login com email/senha e criar uma extensão Chrome para salvar perfis do LinkedIn.

---

### Parte 1: Autenticação do Mentorado

**Abordagem:** Usar o mesmo sistema de auth (email/senha) que o mentor já usa, mas com uma tabela de roles para diferenciar mentor vs mentorado, e vincular o mentorado ao seu plano.

**Banco de dados:**
- Criar tabela `user_roles` com enum `app_role` (admin, mentee) e função `has_role()`
- Criar tabela `mentee_plan_access` vinculando `user_id` do mentorado ao `plan_id`
- O mentor, ao criar o plano, cadastra email/senha do mentorado (ou apenas o email, e o mentorado faz signup)

**Fluxo:**
1. Mentor cria o plano e informa o email do mentorado
2. Sistema cria a conta do mentorado (ou envia convite por email)
3. Mentorado faz login na mesma tela `/auth` e é redirecionado para seu plano
4. Rota `/mentee/:token` é substituída por `/my-plan` (rota protegida para role "mentee")

**Mudanças no código:**
- Atualizar `Auth.tsx` para funcionar para ambos os perfis
- Criar página `MyPlan.tsx` (usa mesmo layout do `MenteeView` atual mas autenticada)
- Atualizar `Home.tsx` para redirecionar mentorados para `/my-plan`
- Atualizar RLS policies para usar `mentee_plan_access` ao invés de tokens públicos
- Manter `plan_access_tokens` como fallback ou remover

---

### Parte 2: Extensão Chrome para LinkedIn

**Funcionalidade:** Botão na página do LinkedIn que captura dados do perfil e salva no `contact_mappings` do plano do mentorado.

**Arquitetura:**
- Extensão Manifest V3 com content script que injeta botão nas páginas de perfil do LinkedIn
- Popup para login (email/senha) e seleção do plano (auto-detectado pelo mentorado)
- Ao clicar "Salvar Perfil", extrai: nome, URL, cargo atual, empresa atual
- Insere diretamente na tabela `contact_mappings` via Supabase client

**Arquivos da extensão:**
- `extension/manifest.json` - Manifest V3, permissões para `linkedin.com`
- `extension/popup.html` + `popup.js` - Login do mentorado
- `extension/content.js` - Content script que injeta botão e extrai dados do perfil
- `extension/background.js` - Service worker para gerenciar sessão

**Empacotamento:** ZIP em `public/` para download dentro do app, com instruções de instalação.

---

### Detalhes Técnicos

**Migração SQL:**
```text
1. CREATE TYPE app_role AS ENUM ('admin', 'mentee')
2. CREATE TABLE user_roles (user_id, role) com RLS
3. CREATE TABLE mentee_plan_access (user_id, plan_id) com RLS
4. CREATE FUNCTION has_role() SECURITY DEFINER
5. Atualizar RLS de todas as tabelas para suportar mentee_plan_access
```

**Extensão Chrome - extração de dados:**
- Seletores CSS do LinkedIn para nome, headline, empresa
- Fallback com meta tags `og:title`
- Dados salvos como contato tipo "other" com status "identified"

**Arquivos modificados:**
- `src/pages/Auth.tsx` - Login unificado
- `src/pages/Home.tsx` - Redirect por role
- Nova `src/pages/MyPlan.tsx` - Dashboard do mentorado autenticado
- `src/pages/CreatePlan.tsx` - Campo para email do mentorado
- Migração SQL para roles e acesso
- `extension/*` - Chrome extension completa

