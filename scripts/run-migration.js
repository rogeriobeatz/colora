#!/usr/bin/env node

// Script para rodar migration no Supabase
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🔄 Rodando migration: Adicionar campos do checkout...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Adicionar campos do checkout na tabela profiles
        ALTER TABLE profiles 
          ADD COLUMN IF NOT EXISTS full_name TEXT,
          ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'cpf',
          ADD COLUMN IF NOT EXISTS document_number TEXT,
          ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

        -- Comentários para documentação
        COMMENT ON COLUMN profiles.full_name IS 'Nome completo do usuário do formulário de checkout';
        COMMENT ON COLUMN profiles.document_type IS 'Tipo de documento: cpf ou cnpj';
        COMMENT ON COLUMN profiles.document_number IS 'Número do CPF ou CNPJ formatado';
        COMMENT ON COLUMN profiles.stripe_customer_id IS 'ID do cliente no Stripe para referência';

        -- Criar índice para otimizar buscas por Stripe customer_id
        CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
      `
    });

    if (error) {
      console.error('❌ Erro na migration:', error);
      process.exit(1);
    }

    console.log('✅ Migration executada com sucesso!');
    console.log('📋 Campos adicionados:');
    console.log('   - full_name: Nome completo do usuário');
    console.log('   - document_type: Tipo de documento (cpf/cnpj)');
    console.log('   - document_number: Número do documento formatado');
    console.log('   - stripe_customer_id: ID do cliente no Stripe');
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  }
}

runMigration();
