
import { QRCodeEntry, CodeStatus } from '../types';

const DB_NAME = 'QRCodeManagerDB';
const STORE_NAME = 'codes';
const DB_VERSION = 1;

export class DatabaseService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('batchId', 'batchId', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject('Failed to open IndexedDB');
    });
  }

  async addCodes(codes: QRCodeEntry[]): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      codes.forEach(code => store.add(code));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject('Error adding batch');
    });
  }

  async getCode(id: string): Promise<QRCodeEntry | undefined> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async markAsUsed(id: string): Promise<void> {
    if (!this.db) await this.init();
    const entry = await this.getCode(id);
    if (!entry) throw new Error('Code not found');
    if (entry.status === CodeStatus.USED) throw new Error('Code already used');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const updatedEntry: QRCodeEntry = {
        ...entry,
        status: CodeStatus.USED,
        usedAt: Date.now()
      };
      const request = store.put(updatedEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject('Update failed');
    });
  }

  async getAllCodes(): Promise<QRCodeEntry[]> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      transaction.oncomplete = () => resolve();
    });
  }
}

export const dbService = new DatabaseService();
