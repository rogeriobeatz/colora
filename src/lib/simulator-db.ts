import Dexie, { Table } from 'dexie';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[SimulatorDB] Usuário não autenticado, salvando localmente");
      return handleLocalDB(db.sessions.put(record), "Erro ao salvar localmente");
    }

    const { data, error } = await supabase
      .from('simulator_sessions')
      .upsert({
        id: record.id,
        user_id: user.id,
        name: record.name,
        data: record.data,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      }, { onConflict: 'id' })
      .select('id')
      .single();

    if (error) {
      console.error("[SimulatorDB] Erro ao salvar no Supabase:", error);
      // Fallback para local
      return handleLocalDB(db.sessions.put(record), "Erro no fallback local");
    }

    console.log("[SimulatorDB] Sessão salva no Supabase:", data.id);
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
      return handleLocalDB(db.sessions.get(id), "Erro ao carregar localmente");
    }

    const { data, error } = await supabase
      .from('simulator_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      console.warn("[SimulatorDB] Sessão não encontrada no Supabase, buscando localmente");
      return handleLocalDB(db.sessions.get(id), "Erro no fallback local");
    }

    return {
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      data: data.data,
    };
  } catch (error: any) {
    console.error("[SimulatorDB] Erro ao carregar sessão:", error);
    return handleLocalDB(db.sessions.get(id), "Erro no fallback local");
  }
}

export async function listSimulatorSessions(): Promise<SimulatorSessionRecord[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const result = await handleLocalDB(db.sessions.orderBy('updatedAt').reverse().toArray(), "Erro ao listar localmente");
      return result || [];
    }

    const { data, error } = await supabase
      .from('simulator_sessions')
      .select('id, name, created_at, updated_at, data')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn("[SimulatorDB] Erro ao listar do Supabase:", error);
      const result = await handleLocalDB(db.sessions.orderBy('updatedAt').reverse().toArray(), "Erro no fallback local");
      return result || [];
    }

    return (data || []).map((s) => ({
      id: s.id,
      name: s.name,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      data: s.data,
    }));
  } catch (error: any) {
    console.error("[SimulatorDB] Erro ao listar sessões:", error);
    const result = await handleLocalDB(db.sessions.orderBy('updatedAt').reverse().toArray(), "Erro no fallback local");
    return result || [];
  }
}

export async function deleteSimulatorSession(id: string): Promise<void | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return handleLocalDB(db.sessions.delete(id), "Erro ao excluir localmente");
    }

    const { error } = await supabase
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
    
    console.log("[SimulatorDB] Sessão excluída:", id);
  } catch (error: any) {
    console.error("[SimulatorDB] Erro ao excluir sessão:", error);
    return handleLocalDB(db.sessions.delete(id), "Erro no fallback local");
  }
}

export async function setLastSessionId(id: string): Promise<string | null> {
  return handleLocalDB(db.meta.put({ key: 'lastSessionId', value: id }), "Erro ao salvar sessão recente");
}

export async function getLastSessionId(): Promise<string | null> {
  const res = await handleLocalDB(db.meta.get('lastSessionId'), "Erro ao buscar sessão recente");
  return res?.value ?? null;
}