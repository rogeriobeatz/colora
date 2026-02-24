# Teste Completo do Fluxo de Checkout

## 📋 Checklist de Verificação

### 1. ✅ Backend Atualizado
- [x] `create-checkout` salva dados no perfil
- [x] `create-checkout` cria cliente Stripe completo
- [x] `check-subscription` verifica e credita tokens
- [x] Logs detalhados para debug

### 2. ✅ Frontend Atualizado
- [x] Checkout com validação CPF/CNPJ
- [x] Salva dados no `user_metadata`
- [x] Fallback para salvar no perfil diretamente
- [x] Dashboard com aba "Meus Dados"
- [x] Dashboard usa `displayData` com fallbacks

### 3. ✅ Database Schema
- [x] Migration criada (precisa rodar manualmente)
- [x] Fallbacks funcionam sem migration

## 🧪 Testes para Fazer

### Teste 1: Checkout Completo
1. Acessar `http://localhost:8081/checkout`
2. Preencher formulário completo:
   - Nome: Teste Usuario
   - Email: teste@exemplo.com
   - Telefone: (11) 99999-9999
   - Empresa: Loja Teste
   - CPF: 123.456.789-00
   - Aceitar termos
3. Clicar "Pagar com Stripe"
4. **VERIFICAR NO CONSOLE:**
   - Dados salvos no perfil?
   - Cliente Stripe criado?
   - Sessão criada?

### Teste 2: Dashboard Pós-Pagamento
1. Após pagamento, redirecionar para Dashboard
2. **VERIFICAR:**
   - Nome da loja aparece correto?
   - Dados pessoais preenchidos?
   - Status da assinatura atualizado?
   - Tokens aparecem?

### Teste 3: Debug Console
Abrir console e verificar:
```javascript
// No Dashboard
console.log('User:', user);
console.log('User metadata:', user?.user_metadata);
console.log('Company:', company);
console.log('Display data:', displayData);
```

## 🔧 Problemas Conhecidos

### Migration não aplicada
**Sintoma:** Campos não existem na tabela
**Solução:** Rodar SQL manual no Supabase Dashboard
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'cpf',
  ADD COLUMN IF NOT EXISTS document_number TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
```

### Tokens não aparecendo
**Sintoma:** Assinatura ativa mas tokens = 0
**Causa:** `check-subscription` não rodou ou falhou
**Solução:** Clicar "Atualizar Status" na Dashboard

## 🚀 Comandos Úteis

```bash
# Ver logs do backend
supabase functions logs create-checkout

# Ver logs do check-subscription  
supabase functions logs check-subscription

# Rodar app
npm run dev
```

## 📊 Fluxo Esperado

```
Checkout → Salva Perfil → Stripe → Pagamento → Dashboard
    ↓            ↓           ↓          ↓
  Formulário → user_metadata → tokens → displayData
```

Se todos os itens acima funcionarem, o fluxo está 100% operacional!
