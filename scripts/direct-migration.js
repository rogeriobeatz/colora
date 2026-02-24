#!/usr/bin/env node

// Script para rodar migration direta no Supabase
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
    
    // Tentar adicionar colunas individualmente
    const columns = [
      { name: 'full_name', type: 'TEXT' },
      { name: 'document_type', type: 'TEXT DEFAULT \'cpf\'' },
      { name: 'document_number', type: 'TEXT' },
      { name: 'stripe_customer_id', type: 'TEXT' }
    ];

    for (const column of columns) {
      try {
        const { error } = await supabase
          .from('profiles')
          .select(column.name)
          .limit(1);
        
        if (error && error.message.includes('column') && error.message.includes('does not exist')) {
          console.log(`➕ Adicionando coluna: ${column.name}`);
          
          // Usar SQL direto via supabase.rpc se disponível, ou pular
          console.log(`   ⚠️  Coluna ${column.name} precisa ser adicionada manualmente via Supabase Dashboard`);
        } else {
          console.log(`✅ Coluna ${column.name} já existe`);
        }
      } catch (err) {
        console.log(`➕ Adicionando coluna: ${column.name}`);
        console.log(`   ⚠️  Coluna ${column.name} precisa ser adicionada manualmente via Supabase Dashboard`);
      }
    }

    console.log('\n✅ Verificação concluída!');
    console.log('\n📋 Para completar a migration, acesse o Supabase Dashboard e execute:');
    console.log('```sql');
    console.log('-- Adicionar campos do checkout na tabela profiles');
    console.log('ALTER TABLE profiles ');
    console.log('  ADD COLUMN IF NOT EXISTS full_name TEXT,');
    console.log('  ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT \'cpf\',');
    console.log('  ADD COLUMN IF NOT EXISTS document_number TEXT,');
    console.log('  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;');
    console.log('');
    console.log('-- Criar índice para otimizar buscas');
    console.log('CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);');
    console.log('```');
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  }
}

runMigration();
