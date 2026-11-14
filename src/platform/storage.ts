/**
 * Almacenamiento persistente: IndexedDB (sin límite de 5 MB ni bloqueo síncrono)
 * con respaldo en localStorage si IndexedDB no está disponible (modo privado antiguo, etc.).
 */
const DB = 'bunker';
const STORE = 'kv';
let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

const LS_PREFIX = 'bunker:';

export async function load<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  if (db) {
    try {
      return await new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const r = tx.objectStore(STORE).get(key);
        r.onsuccess = () => resolve(r.result as T | undefined);
        r.onerror = () => reject(r.error);
      });
    } catch {
      /* cae al respaldo */
    }
  }
  try {
    const v = localStorage.getItem(LS_PREFIX + key);
    return v ? (JSON.parse(v) as T) : undefined;
  } catch {
    return undefined;
  }
}

export async function save<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  if (db) {
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      return;
    } catch {
      /* cae al respaldo */
    }
  }
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {
    /* sin almacenamiento: la partida no se guarda */
  }
}

export async function remove(key: string): Promise<void> {
  const db = await openDb();
  if (db) {
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      /* ignorar */
    }
  }
  try {
    localStorage.removeItem(LS_PREFIX + key);
  } catch {
    /* ignorar */
  }
}
