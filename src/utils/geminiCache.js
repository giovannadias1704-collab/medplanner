/**
 * Cache em memória e localStorage para respostas do Gemini com expiração TTL.
 */
class GeminiCache {
  #cache = new Map();
  #ttlMs;
  #hits = 0;
  #misses = 0;

  /**
   * @param {number} [ttlMs=3600000] Tempo de vida da cache em milissegundos (padrão: 1 hora)
   */
  constructor(ttlMs = 3600000) {
    this.#ttlMs = ttlMs;
  }

  /**
   * Salva um valor na cache (memória + localStorage).
   * @param {string} key Chave única
   * @param {*} value Valor a ser armazenado
   */
  set(key, value) {
    const entry = { value, ts: Date.now() };
    this.#cache.set(key, entry);
    try {
      localStorage.setItem(`gemini_cache_${key}`, JSON.stringify(entry));
    } catch (e) {
      console.warn('Falha ao salvar no localStorage (possivelmente cheio):', e);
    }
  }

  /**
   * Retorna o valor se não expirado.
   * @param {string} key Chave
   * @returns {*} Valor ou undefined se expirado ou não existe
   */
  get(key) {
    let entry = this.#cache.get(key);
    const now = Date.now();
    if (entry && now - entry.ts < this.#ttlMs) {
      this.#hits++;
      return entry.value;
    }
    this.#cache.delete(key);

    const lsKey = `gemini_cache_${key}`;
    const lsStr = localStorage.getItem(lsKey);
    if (lsStr) {
      try {
        const { value, ts } = JSON.parse(lsStr);
        if (now - ts < this.#ttlMs) {
          entry = { value, ts };
          this.#cache.set(key, entry);
          this.#hits++;
          return value;
        }
        localStorage.removeItem(lsKey);
      } catch (e) {
        localStorage.removeItem(lsKey);
      }
    }
    this.#misses++;
    return undefined;
  }

  /**
   * Verifica se existe um valor válido (não expirado).
   * @param {string} key Chave
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== undefined;
  }

  /**
   * Remove entrada da cache.
   * @param {string} key Chave
   */
  delete(key) {
    this.#cache.delete(key);
    localStorage.removeItem(`gemini_cache_${key}`);
  }

  /**
   * Limpa toda a cache (memória e localStorage).
   */
  clear() {
    this.#cache.clear();
    this.#hits = 0;
    this.#misses = 0;
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('gemini_cache_')) {
        localStorage.removeItem(k);
      }
    });
  }

  /**
   * Retorna estatísticas da cache.
   * @returns {{hits: number, misses: number, size: number, hitRate: number}}
   */
  getStats() {
    const total = this.#hits + this.#misses;
    return {
      hits: this.#hits,
      misses: this.#misses,
      size: this.#cache.size,
      hitRate: total > 0 ? this.#hits / total : 0
    };
  }
}

export { GeminiCache };