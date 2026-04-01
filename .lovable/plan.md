

## Plano: Formulário editável na extensão ao invés de extração automática

### Problema
O DOM do LinkedIn muda frequentemente e varia entre idiomas/layouts. Tentar extrair cargo e empresa automaticamente da seção de Experiências é frágil e falha em muitos perfis.

### Solução
Ao clicar em "Salvar no Orion", em vez de salvar direto, abrir um **mini formulário flutuante** pré-preenchido com o que conseguiu extrair (nome do título da página, URL). O usuário confirma/edita os campos antes de salvar.

### Como funciona
1. Usuário clica no botão "Salvar no Orion"
2. Aparece um card flutuante (fixed, bottom-right) com campos editáveis:
   - **Nome** (pré-preenchido do `document.title`)
   - **Cargo Atual** (pré-preenchido se encontrado, senão vazio)
   - **Empresa Atual** (pré-preenchido se encontrada, senão vazio)
   - **Tipo** (dropdown: Decisor / RH / Outro)
   - **Tier** (dropdown: A / B / C)
3. Botões "Salvar" e "Cancelar"
4. A extração automática continua tentando preencher, mas o usuário sempre pode corrigir

### Mudanças
- **`extension/content.js`**: Substituir `handleSave` direto por `showSaveForm()` que cria um card HTML com inputs. Manter a lógica de extração como "best effort" para pré-preencher. Remover as validações que bloqueiam o salvamento quando cargo/empresa não são encontrados.
- **`public/orion-linkedin-extension.zip`**: Reempacotar.

### Benefício
- Funciona em qualquer perfil do LinkedIn independente do layout
- O mentorado tem controle total sobre os dados salvos
- A extração automática ainda ajuda quando funciona, mas não bloqueia mais

