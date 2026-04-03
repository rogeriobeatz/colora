import { openDB, type IDBPDatabase } from 'idb';
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
  key: string;
  value: string;
};

const DB_NAME = "colora_simulator";
const DB_VERSION = 11; // Incrementado para resolver conflito de versão

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('sessions')) {
        const store = db.createObjectStore('sessions', { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    },
  });
}

// Wrapper for IndexedDB errors
async function handleLocalDB<T>(fn: () => Promise<T>, errorMessage: string): Promise<T | null> {
  try {
    return await fn();
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
      const db = await getDB();
      await db.put('sessions', record);
      return record.id;
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

    if (error) {
      console.error("[SimulatorDB] Erro ao salvar no Supabase:", error);
      const db = await getDB();
      await db.put('sessions', record);
      return record.id;
    }

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
      const db = await getDB();
      return (await db.get('sessions', id)) || null;
    }

    const { data, error } = await (supabase as any)
      .from('simulator_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      const db = await getDB();
      return (await db.get('sessions', id)) || null;
    }

    return {
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      data: data.data,
    };
  } catch (error: any) {
    console.error("[SimulatorDB] Erro ao carregar projeto:", error);
    const db = await getDB();
    return (await db.get('sessions', id)) || null;
  }
}

export async function listSimulatorSessions(): Promise<SimulatorSessionRecord[]> {
  try {
    // Tenta getUser com timeout curto ou fallback imediato para getSession
    // para evitar NavigatorLockAcquireTimeoutError
    const { data: { user } } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<any>((resolve) => 
        setTimeout(async () => {
          const { data } = await supabase.auth.getSession();
          resolve({ data: { user: data.session?.user || null } });
        }, 1000)
      )
    ]);

    if (!user) {
      const db = await getDB();
      const all = await db.getAllFromIndex('sessions', 'updatedAt');
      return all.reverse();
    }

    const { data, error } = await (supabase as any)
      .from('simulator_sessions')
      .select('id, name, created_at, updated_at, data') // Incluído campo data completo
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn("[SimulatorDB] Erro ao listar do Supabase:", error);
      const db = await getDB();
      const all = await db.getAllFromIndex('sessions', 'updatedAt');
      return all.reverse();
    }

    return (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      data: s.data,
    }));
  } catch (error: any) {
    console.error("[SimulatorDB] Erro ao listar projetos:", error);
    const db = await getDB();
    const all = await db.getAllFromIndex('sessions', 'updatedAt');
    return all.reverse();
  }
}

export async function deleteSimulatorSession(id: string): Promise<void | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const db = await getDB();
      await db.delete('sessions', id);
      return;
    }

    const { error } = await (supabase as any)
      .from('simulator_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.warn("[SimulatorDB] Erro ao excluir do Supabase:", error);
    }

    // Also remove from local
    const db = await getDB();
    await db.delete('sessions', id);
  } catch (error: any) {
    console.error("[SimulatorDB] Erro ao excluir projeto:", error);
    return null;
  }
}

export async function setLastSessionId(id: string): Promise<string | null> {
  return handleLocalDB(async () => {
    const db = await getDB();
    await db.put('meta', { key: 'lastSessionId', value: id });
    return id;
  }, "Erro ao salvar projeto recente");
}

export async function getLastSessionId(): Promise<string | null> {
  const res = await handleLocalDB(async () => {
    const db = await getDB();
    return db.get('meta', 'lastSessionId') as Promise<MetaRecord | undefined>;
  }, "Erro ao buscar projeto recente");
  return res?.value ?? null;
}

export function generateUUID(): string {
  return uuidv4();
}

export async function analyzeSupabaseTables() {
  try {
    const { data: profiles } = await supabase.from('profiles').select('id, company_name, document_number, tokens');
    const { data: catalogs } = await supabase.from('catalogs').select('id, name, company_id');
    const { data: paints } = await supabase.from('paints').select('id, name, hex, code, catalog_id');
    const { data: sessions } = await supabase.from('simulator_sessions').select('id, name, user_id, created_at');
    const { data: consumptions } = await supabase.from('token_consumptions').select('id, amount, user_id, created_at');
    const { data: cache } = await supabase.from('wall_cache').select('hash, created_at');

    return {
      profiles: profiles?.length || 0,
      catalogs: catalogs?.length || 0,
      paints: paints?.length || 0,
      sessions: sessions?.length || 0,
      consumptions: consumptions?.length || 0,
      cache: cache?.length || 0
    };
  } catch (error) {
    console.error("Erro na análise:", error);
    return null;
  }
}

export async function forceSyncFromSupabase(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('sessions');
    await db.clear('meta');
    window.location.reload();
  } catch (error) {
    console.error("[SimulatorDB] Erro ao limpar cache:", error);
  }
}

export async function checkSyncStatus(): Promise<{local: number, remote: number}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { local: 0, remote: 0 };

    const db = await getDB();
    const localCount = (await db.getAll('sessions')).length;

    const { data } = await (supabase as any)
      .from('simulator_sessions')
      .select('id')
      .eq('user_id', user.id);

    return { local: localCount, remote: data?.length || 0 };
  } catch (error) {
    console.error("[SimulatorDB] Erro ao verificar sincronização:", error);
    return { local: 0, remote: 0 };
  }
}
