export type SimulatorSessionRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: unknown;
};

type MetaRecord = { key: string; value: string };

const DB_NAME = "colora_simulator";
const DB_VERSION = 1;

const STORE_SESSIONS = "sessions";
const STORE_META = "meta";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        db.createObjectStore(STORE_SESSIONS, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  const tx = db.transaction(storeName, mode);
  const store = tx.objectStore(storeName);
  const res = await txPromise(fn(store));

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });

  db.close();
  return res;
}

export async function saveSimulatorSession(record: SimulatorSessionRecord) {
  return withStore(STORE_SESSIONS, "readwrite", (store) => store.put(record));
}

export async function getSimulatorSession(id: string): Promise<SimulatorSessionRecord | undefined> {
  const res = await withStore<SimulatorSessionRecord | undefined>(STORE_SESSIONS, "readonly", (store) =>
    store.get(id) as IDBRequest<SimulatorSessionRecord | undefined>,
  );
  return res;
}

export async function listSimulatorSessions(): Promise<SimulatorSessionRecord[]> {
  const res = await withStore<SimulatorSessionRecord[]>(STORE_SESSIONS, "readonly", (store) =>
    store.getAll() as IDBRequest<SimulatorSessionRecord[]>,
  );

  return (res || []).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function deleteSimulatorSession(id: string) {
  return withStore(STORE_SESSIONS, "readwrite", (store) => store.delete(id));
}

export async function setLastSessionId(id: string) {
  const meta: MetaRecord = { key: "lastSessionId", value: id };
  return withStore(STORE_META, "readwrite", (store) => store.put(meta));
}

export async function getLastSessionId(): Promise<string | null> {
  const res = await withStore<MetaRecord | undefined>(STORE_META, "readonly", (store) =>
    store.get("lastSessionId") as IDBRequest<MetaRecord | undefined>,
  );
  return res?.value ?? null;
}