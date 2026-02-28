// hooks/useAudit.js
import { useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../services/firebase';         // ✅ usa o auth exportado do seu firebase.js
import { AuditActions } from '../services/auditService';

/**
 * Hook que expõe funções de auditoria com o usuário atual já injetado.
 *
 * Exemplo de uso:
 *   const { logLogin, logCreate, logPageView } = useAudit();
 */
export function useAudit() {
  const [user] = useAuthState(auth);

  const logLogin      = useCallback((method = 'email')       => AuditActions.LOGIN(user, method),             [user]);
  const logLoginGoogle= useCallback(()                       => AuditActions.LOGIN(user, 'google'),            [user]);
  const logLogout     = useCallback(()                       => AuditActions.LOGOUT(user),                    [user]);
  const logCreate     = useCallback((col, docId, data)       => AuditActions.CREATE(user, col, docId, data),  [user]);
  const logUpdate     = useCallback((col, docId, changes)    => AuditActions.UPDATE(user, col, docId, changes),[user]);
  const logDelete     = useCallback((col, docId)             => AuditActions.DELETE(user, col, docId),        [user]);
  const logPageView   = useCallback((path, title = '')       => AuditActions.PAGE_VIEW(user, path, title),    [user]);

  return {
    logLogin,
    logLoginGoogle, // ✅ específico para o GoogleAuthProvider que você já tem configurado
    logLogout,
    logCreate,
    logUpdate,
    logDelete,
    logPageView,
  };
}