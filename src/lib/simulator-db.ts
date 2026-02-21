import Dexie, { Table } from 'dexie';
import { toast } from 'sonner';

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
      sessions: 'id, updatedAt', // index updatedAt for sorting
      meta: 'key',
    });
  }
}

const db = new SimulatorDB();

// Wrapper to catch Dexie errors and show a toast
async function handleDB<T>(promise: Promise<T>, errorMessage: string): Promise<T | null> {
  try {
    return await promise;
  } catch (error: any) {
    console.error(`[SimulatorDB] ${errorMessage}:`, error);
    toast.error(errorMessage, {
      description: error.message || 'O banco de dados local pode não estar disponível ou corrompido.',
    });
    return null;
  }
}

export async function saveSimulatorSession(record: SimulatorSessionRecord): Promise<string | null> {
  return handleDB(db.sessions.put(record), "Erro ao salvar o projeto");
}

export async function getSimulatorSession(id: string): Promise<SimulatorSessionRecord | null> {
  return handleDB(db.sessions.get(id), "Erro ao carregar o projeto");
}

export async function listSimulatorSessions(): Promise<SimulatorSessionRecord[]> {
  const result = await handleDB(db.sessions.orderBy('updatedAt').reverse().toArray(), "Erro ao listar os projetos");
  return result || [];
}

export async function deleteSimulatorSession(id: string): Promise<void | null> {
  return handleDB(db.sessions.delete(id), "Erro ao excluir o projeto");
}

export async function setLastSessionId(id: string): Promise<string | null> {
  return handleDB(db.meta.put({ key: 'lastSessionId', value: id }), "Erro ao salvar a sessão recente");
}

export async function getLastSessionId(): Promise<string | null> {
  const res = await handleDB(db.meta.get('lastSessionId'), "Erro ao buscar a sessão recente");
  return res?.value ?? null;
}
