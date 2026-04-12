export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class CacheService {
  private store = new Map<string, CacheEntry<any>>();
  private promises = new Map<string, Promise<any>>();
  private readonly ttlMs: number;

  constructor(ttlSeconds = 600) {
    this.ttlMs = ttlSeconds * 1000;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /**
   * Deduplica requisições concorrentes para a mesma chave.
   * Se ja existir uma promessa em andamento para `key`, ela e retornada
   * em vez de executar o factory novamente.
   */
  async deduplicate<T>(key: string, factory: () => Promise<T>): Promise<T> {
    // Retorna dados em cache de forma sincrona
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    // Aguarda requisição ja em andamento
    const inFlight = this.promises.get(key);
    if (inFlight) return inFlight as Promise<T>;

    const promise = factory().then((data) => {
      this.set(key, data);
      this.promises.delete(key);
      return data;
    });

    this.promises.set(key, promise);
    return promise;
  }

  /**
   * Invalida uma unica chave
   */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /**
   * Limpa todas as entradas
   */
  clear(): void {
    this.store.clear();
    this.promises.clear();
  }
}
