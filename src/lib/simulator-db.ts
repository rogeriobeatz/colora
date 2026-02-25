import Dexie, { Table } from 'dexie';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

export type SimulatorSessionRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: unknown;
};

type MetaRecord = {
  key: 'lastSessionId';
  value: string;
};

const DB_NAME = "colora_simulator";

class SimulatorDB extends Dexie {
  sessions!: Table<SimulatorSessionRecord, string>;
  meta!: Table<MetaRecord, string>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      sessions: 'id, updatedAt',
      meta: 'key',
    });
  }
}

const db = new SimulatorDB();

// Wrapper para erros do IndexedDB (fallback local)
async function handleLocalDB<T>(promise: Promise<T>, errorMessage: string): Promise<T | null> {
  try {
    return await promise;
  } catch (error: any) {
    console.error(`[SimulatorDB Local] ${errorMessage}:`, error);
    return null;
  }
}

// ==================== SUPABASE ====================

export async function saveSimulatorSession(record: SimulatorSessionRecord): Promise<string | null> {
  try {
    console.log("[SimulatorDB] 💾 Salvando projeto:", record); // Debug
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[SimulatorDB] Usuário não autenticado, salvando localmente");
      console.log("[SimulatorDB] 📱 Salvando no IndexedDB (offline)"); // Debug
      return handleLocalDB(db.sessions.put(record), "Erro ao salvar localmente");
    }

    const { data, error } = await (supabase as any)
      .from('simulator_sessions')
      .upsert({
        id: record.id,
        user_id: user.id,
        name: record.name,
        data: record.data,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      }, { onConflict: 'id' })
      .select('id, name, updated_at')
      .single();

    console.log("[SimulatorDB] 🌐 Resultado do upsert no Supabase:", { data, error }); // Debug

    if (error) {
      console.error("[SimulatorDB] Erro ao salvar no Supabase:", error);
      console.log("[SimulatorDB] 📱 Fallback: Salvando no IndexedDB"); // Debug
      return handleLocalDB(db.sessions.put(record), "Erro no fallback local");
    }

    console.log("[SimulatorDB] 🌐 Projeto salvo no Supabase com sucesso:", data.id);
    console.log(`[SimulatorDB] ✅ "${record.name}" persistido no banco de dados!`); // Debug
    return data?.id || record.id;
  } catch (error: any) {
    console.error("[SimulatorDB] Erro crítico ao salvar:", error);
    toast.error("Erro ao salvar o projeto");
    return null;
  }
}

export async function getSimulatorSession(id: string): Promise<SimulatorSessionRecord | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const result = await handleLocalDB(db.sessions.get(id), "Erro ao carregar localmente");
      console.log("[SimulatorDB] Carregado do IndexedDB:", result); // Debug
      return result;
    }

    const { data, error } = await (supabase as any)
      .from('simulator_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    console.log("[SimulatorDB] Dados brutos do Supabase:", { data, error }); // Debug

    if (error || !data) {
      console.warn("[SimulatorDB] Projeto não encontrado no Supabase, buscando localmente");
      const result = await handleLocalDB(db.sessions.get(id), "Erro no fallback local");
      console.log("[SimulatorDB] Fallback para IndexedDB:", result); // Debug
      return result;
    }

    const result = {
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      data: data.data,
    };
    
    console.log("[SimulatorDB] Dados processados:", result); // Debug
    return result;
  } catch (error: any) {
    console.error("[SimulatorDB] Erro ao carregar projeto:", error);
    return handleLocalDB(db.sessions.get(id), "Erro no fallback local");
  }
}

export async function listSimulatorSessions(): Promise<SimulatorSessionRecord[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const result = await handleLocalDB(db.sessions.orderBy('updatedAt').reverse().toArray(), "Erro ao listar localmente");
      console.log("[SimulatorDB] 📱 Lista do IndexedDB (offline):", result); // Debug
      return result || [];
    }

    const { data, error } = await (supabase as any)
      .from('simulator_sessions')
      .select('id, name, created_at, updated_at, data')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    console.log("[SimulatorDB] 🌐 Dados brutos da lista Supabase:", { data, error }); // Debug

    if (error) {
      console.warn("[SimulatorDB] Erro ao listar do Supabase:", error);
      const result = await handleLocalDB(db.sessions.orderBy('updatedAt').reverse().toArray(), "Erro no fallback local");
      console.log("[SimulatorDB] 📱 Fallback para IndexedDB:", result); // Debug
      return result || [];
    }

    const result = (data || []).map((s) => ({
      id: s.id,
      name: s.name,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      data: s.data,
    }));
    
    console.log("[SimulatorDB] 🌐 Lista processada do Supabase:", result); // Debug
    console.log(`[SimulatorDB] ✅ ${result.length} projetos carregados do banco de dados!`); // Debug
    return result;
  } catch (error: any) {
    console.error("[SimulatorDB] Erro ao listar projetos:", error);
    const result = await handleLocalDB(db.sessions.orderBy('updatedAt').reverse().toArray(), "Erro no fallback local");
    console.log("[SimulatorDB] 📱 Fallback final para IndexedDB:", result); // Debug
    return result || [];
  }
}

export async function deleteSimulatorSession(id: string): Promise<void | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return handleLocalDB(db.sessions.delete(id), "Erro ao excluir localmente");
    }

    const { error } = await (supabase as any)
      .from('simulator_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.warn("[SimulatorDB] Erro ao excluir do Supabase:", error);
      return handleLocalDB(db.sessions.delete(id), "Erro no fallback local");
    }

    // Também remove do local
    await db.sessions.delete(id);
    
    console.log("[SimulatorDB] Projeto excluído:", id);
  } catch (error: any) {
    console.error("[SimulatorDB] Erro ao excluir projeto:", error);
    return handleLocalDB(db.sessions.delete(id), "Erro no fallback local");
  }
}

export async function setLastSessionId(id: string): Promise<string | null> {
  return handleLocalDB(db.meta.put({ key: 'lastSessionId', value: id }), "Erro ao salvar projeto recente");
}

export async function getLastSessionId(): Promise<string | null> {
  const res = await handleLocalDB(db.meta.get('lastSessionId'), "Erro ao buscar projeto recente");
  return res?.value ?? null;
}

// Função para gerar UUID válido
export function generateUUID(): string {
  return uuidv4();
}

// Função para limpar projetos locais com IDs inválidos
export async function cleanInvalidLocalProjects(): Promise<void> {
  try {
    const allSessions = await db.sessions.toArray();
    const invalidSessions = allSessions.filter(session => {
      // Verifica se o ID é um UUID válido (formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return !uuidRegex.test(session.id);
    });
    
    if (invalidSessions.length > 0) {
      console.log(`[SimulatorDB] Limpando ${invalidSessions.length} projetos locais com IDs inválidos`);
      await db.sessions.bulkDelete(invalidSessions.map(s => s.id));
    }
  } catch (error) {
    console.error("[SimulatorDB] Erro ao limpar projetos inválidos:", error);
  }
}
