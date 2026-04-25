/**
 * Módulo de guards para rotas do MedPlanner.
 * Funções puras para validação de autenticação, roles e subscriptions.
 * Sem dependências externas.
 */

const SUBSCRIPTION_LEVELS = {
  free: 0,
  premium: 1,
  vitalicio: 2
};

/**
 * Níveis de assinatura numéricos para comparações.
 * @type {Object<string, number>}
 */
export { SUBSCRIPTION_LEVELS };

/**
 * Verifica se o usuário está autenticado.
 * @param {Object} user - Objeto do usuário do contexto de autenticação.
 * @returns {boolean} Retorna true se o usuário existe e está autenticado.
 */
export function isUserAuthenticated(user) {
  return !!user;
}

/**
 * Verifica se o usuário possui uma assinatura ativa (premium ou vitalício).
 * Free é considerado restrito e não ativo para acessos protegidos.
 * @param {Object} user - Objeto do usuário.
 * @returns {boolean} Retorna true se a assinatura é premium ou vitalícia.
 */
export function hasActiveSubscription(user) {
  if (!user?.subscription?.status) {
    return false;
  }
  const status = user.subscription.status.toLowerCase();
  const level = SUBSCRIPTION_LEVELS[status];
  return level > 0;
}

/**
 * Verifica se o usuário possui role de admin.
 * @param {Object} user - Objeto do usuário.
 * @returns {boolean} Retorna true se role === 'admin'.
 */
export function isAdmin(user) {
  return user?.role === 'admin';
}

/**
 * Função genérica para validar acesso a uma rota específica.
 * Combina verificações de autenticação, role e nível de assinatura.
 * @param {Object} user - Objeto do usuário.
 * @param {string|null} [requiredRole=null] - Role requerida (ex: 'admin').
 * @param {number} [requiredSubscription=0] - Nível mínimo de assinatura requerido.
 * @returns {boolean} Retorna true se o usuário tem acesso à rota.
 */
export function canAccessRoute(user, requiredRole = null, requiredSubscription = 0) {
  try {
    if (!isUserAuthenticated(user)) {
      return false;
    }
    if (requiredRole && user.role !== requiredRole) {
      return false;
    }
    if (requiredSubscription > 0) {
      if (!hasActiveSubscription(user) || (SUBSCRIPTION_LEVELS[user.subscription.status.toLowerCase()] || 0) < requiredSubscription) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Erro durante validação de acesso à rota:', error);
    return false;
  }
}