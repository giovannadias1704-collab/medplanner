/**
 * Rate limiter persistente com localStorage para tipos de ações do Gemini.
 * Suporta limites por minuto e diário global.
 */
class GeminiRateLimiter {
  #limits;
  #dailyKey = 'gemini_rl_daily_requests';
  #types = ['chat', 'flashcards'];

  /**
   * @param {{chat: {perMinute: number}, flashcards: {perMinute: number}, default: {perMinute: number}, daily: number}} [limits]
   */
  constructor(limits = {
    chat: { perMinute: 5 },
    flashcards: { perMinute: 2 },
    default: { perMinute: 10 },
    daily: 100
  }) {
    this.#limits = limits;
  }

  #getRequestsKey(type) {
    return `gemini_rl_requests_${type}`;
  }

  #cleanDaily(now) {
    let reqs = JSON.parse(localStorage.getItem(this.#dailyKey) || '[]');
    reqs = reqs.filter((ts) => ts > now - 86400000 * 2);
    localStorage.setItem(this.#dailyKey, JSON.stringify(reqs));
  }

  #cleanRequests(type, now) {
    const key = this.#getRequestsKey(type);
    let reqs = JSON.parse(localStorage.getItem(key) || '[]');
    reqs = reqs.filter((ts) => ts > now - 86400000 * 2);
    localStorage.setItem(key, JSON.stringify(reqs));
  }

  #getDailyCount(now) {
    this.#cleanDaily(now);
    const reqs = JSON.parse(localStorage.getItem(this.#dailyKey) || '[]');
    return reqs.filter((ts) => ts > now - 86400000).length;
  }

  /**
   * Verifica se pode fazer requisição.
   * @param {string} actionType Tipo de ação
   * @returns {boolean}
   */
  canMakeRequest(actionType) {
    const now = Date.now();
    this.#cleanDaily(now);
    this.#cleanRequests(actionType, now);

    const dailyReqs = JSON.parse(localStorage.getItem(this.#dailyKey) || '[]');
    const dailyCount = dailyReqs.filter((ts) => ts > now - 86400000).length;
    if (dailyCount >= this.#limits.daily) {
      return false;
    }

    const reqsKey = this.#getRequestsKey(actionType);
    const reqs = JSON.parse(localStorage.getItem(reqsKey) || '[]');
    const recentCount = reqs.filter((ts) => ts > now - 60000).length;
    const perMinLimit = this.#limits[actionType]?.perMinute ?? this.#limits.default.perMinute;
    const remaining = perMinLimit - recentCount;

    if (remaining <= 2) {
      console.warn(
        `⚠️ Aviso: Próximo do limite para ${actionType}! Restam ${remaining}/${perMinLimit} por minuto.`
      );
    }

    return remaining > 0;
  }

  /**
   * Registra uma requisição (após verificação).
   * @param {string} actionType
   */
  recordRequest(actionType) {
    const now = Date.now();
    // Daily
    this.#cleanDaily(now);
    let dailyReqs = JSON.parse(localStorage.getItem(this.#dailyKey) || '[]');
    dailyReqs.push(now);
    dailyReqs = dailyReqs.filter((ts) => ts > now - 86400000 * 2);
    localStorage.setItem(this.#dailyKey, JSON.stringify(dailyReqs));

    // Per type
    this.#cleanRequests(actionType, now);
    const reqsKey = this.#getRequestsKey(actionType);
    let reqs = JSON.parse(localStorage.getItem(reqsKey) || '[]');
    reqs.push(now);
    reqs = reqs.filter((ts) => ts > now - 86400000 * 2);
    localStorage.setItem(reqsKey, JSON.stringify(reqs));
  }

  /**
   * Requisições restantes por minuto para o tipo.
   * @param {string} actionType
   * @returns {number}
   */
  getRemainingRequests(actionType) {
    const now = Date.now();
    this.#cleanRequests(actionType, now);
    const reqs = JSON.parse(localStorage.getItem(this.#getRequestsKey(actionType)) || '[]');
    const recentCount = reqs.filter((ts) => ts > now - 60000).length;
    const perMinLimit = this.#limits[actionType]?.perMinute ?? this.#limits.default.perMinute;
    return perMinLimit - recentCount;
  }

  /**
   * Status geral de quotas.
   * @returns {object}
   */
  getQuotaStatus() {
    const now = Date.now();
    const dailyCount = this.#getDailyCount(now);
    const status = {
      daily: {
        remaining: this.#limits.daily - dailyCount,
        resetTime: new Date(Math.ceil(now / 86400000) * 86400000).toLocaleString('pt-BR')
      }
    };

    this.#types.forEach((type) => {
      const remaining = this.getRemainingRequests(type);
      status[type] = {
        remainingPerMinute: remaining,
        resetTimePerMinute: new Date(Math.ceil(now / 60000) * 60000).toLocaleString('pt-BR')
      };
    });

    return status;
  }
}

export { GeminiRateLimiter };