import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { createOrUpdateUserProfile } from './userService';

// ========== REGISTRO ==========

export async function registerWithEmail(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Atualizar perfil do usuário
    await updateProfile(user, { displayName });
    
    // Enviar email de verificação
    await sendEmailVerification(user);

    // Criar perfil no Firestore com estrutura de subscription
    await createOrUpdateUserProfile({
      ...user,
      displayName
    });

    console.log('✅ Usuário registrado com sucesso!');
    
    return {
      success: true,
      user: user,
      message: 'Conta criada! Verifique seu email para ativar sua conta.'
    };
  } catch (error) {
    console.error('❌ Erro ao registrar:', error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

// ========== LOGIN COM EMAIL ==========

export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Criar/atualizar perfil no Firestore (atualiza lastLoginAt e verifica reset mensal)
    await createOrUpdateUserProfile(user);

    console.log('✅ Login realizado com sucesso!');
    
    return {
      success: true,
      user: user,
      emailVerified: user.emailVerified
    };
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

// ========== LOGIN COM GOOGLE (POPUP COM FALLBACK PARA REDIRECT) ==========

export async function loginWithGoogle() {
  try {
    console.log('🔵 Iniciando login com Google (popup)...');
    
    // Tentar popup primeiro
    const result = await signInWithPopup(auth, googleProvider);
    
    console.log('✅ Login com popup bem-sucedido:', result.user.email);
    
    const user = result.user;
    
    // Criar/atualizar perfil no Firestore (cria se novo, atualiza se existente)
    await createOrUpdateUserProfile(user);
    
    console.log('✅ Perfil do usuário sincronizado com Firestore');
    
    return {
      success: true,
      user: user,
      isNewUser: result._tokenResponse?.isNewUser || false
    };
    
  } catch (error) {
    console.error('❌ Erro no login com Google:', error);
    
    // Se popup foi bloqueado, tentar redirect como fallback
    if (error.code === 'auth/popup-blocked') {
      console.log('⚠️ Popup bloqueado, tentando redirect...');
      
      try {
        sessionStorage.setItem('googleLoginInProgress', 'true');
        sessionStorage.setItem('googleLoginTimestamp', Date.now().toString());
        
        await signInWithRedirect(auth, googleProvider);
        
        return { success: true, redirecting: true };
      } catch (redirectError) {
        console.error('❌ Erro no redirect:', redirectError);
        sessionStorage.removeItem('googleLoginInProgress');
        sessionStorage.removeItem('googleLoginTimestamp');
        
        return {
          success: false,
          error: redirectError.code,
          message: getErrorMessage(redirectError.code)
        };
      }
    }
    
    // Popup foi fechado pelo usuário
    if (error.code === 'auth/popup-closed-by-user') {
      return {
        success: false,
        error: error.code,
        message: 'Login cancelado. Tente novamente.'
      };
    }
    
    // Outros erros
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

// ========== CAPTURAR RESULTADO DO REDIRECT (APENAS COMO FALLBACK) ==========

export async function handleRedirectResult() {
  try {
    // Só verificar redirect se havia um em progresso
    const wasRedirecting = sessionStorage.getItem('googleLoginInProgress') === 'true';
    
    if (!wasRedirecting) {
      console.log('ℹ️ Nenhum redirect pendente, pulando verificação');
      return { success: false, noRedirect: true };
    }
    
    console.log('🔍 Verificando resultado do redirect do Google...');
    
    const redirectTimestamp = sessionStorage.getItem('googleLoginTimestamp');
    
    if (redirectTimestamp) {
      const elapsed = Date.now() - parseInt(redirectTimestamp);
      const fiveMinutes = 5 * 60 * 1000;
      
      if (elapsed > fiveMinutes) {
        console.log('⏰ Redirect expirado (>5min), limpando sessionStorage');
        sessionStorage.removeItem('googleLoginInProgress');
        sessionStorage.removeItem('googleLoginTimestamp');
        return { success: false, noRedirect: true };
      }
      
      console.log('⏱️ Tempo desde o redirect:', Math.round(elapsed / 1000), 'segundos');
    }
    
    const result = await getRedirectResult(auth);
    
    if (result && result.user) {
      console.log('✅ getRedirectResult retornou usuário:', result.user.email);
      sessionStorage.removeItem('googleLoginInProgress');
      sessionStorage.removeItem('googleLoginTimestamp');
      
      const user = result.user;
      
      // Criar/atualizar perfil no Firestore
      await createOrUpdateUserProfile(user);
      
      console.log('✅ Perfil do usuário sincronizado com Firestore');

      return {
        success: true,
        user: user,
        isNewUser: result._tokenResponse?.isNewUser || false
      };
    }
    
    // Se não retornou usuário mas estava redirecionando
    console.log('❌ Redirect estava pendente mas nenhum usuário foi encontrado');
    sessionStorage.removeItem('googleLoginInProgress');
    sessionStorage.removeItem('googleLoginTimestamp');
    
    return { 
      success: false, 
      noRedirect: true,
      error: 'redirect-failed',
      message: 'Login não completado. Tente novamente.'
    };
    
  } catch (error) {
    console.error('❌ Erro ao processar redirect:', error);
    sessionStorage.removeItem('googleLoginInProgress');
    sessionStorage.removeItem('googleLoginTimestamp');
    
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

// ========== LOGOUT ==========

export async function logout() {
  try {
    await signOut(auth);
    sessionStorage.removeItem('googleLoginInProgress');
    sessionStorage.removeItem('googleLoginTimestamp');
    console.log('✅ Logout realizado com sucesso!');
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error);
    return {
      success: false,
      error: error.code,
      message: 'Erro ao fazer logout. Tente novamente.'
    };
  }
}

// ========== RECUPERAÇÃO DE SENHA ==========

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: window.location.origin + '/auth',
      handleCodeInApp: false
    });

    console.log('✅ Email de recuperação enviado!');
    
    return {
      success: true,
      message: 'Email de recuperação enviado! Verifique sua caixa de entrada.'
    };
  } catch (error) {
    console.error('❌ Erro ao enviar email de recuperação:', error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

// ========== REENVIAR VERIFICAÇÃO DE EMAIL ==========

export async function resendVerificationEmail() {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return {
        success: false,
        message: 'Usuário não autenticado.'
      };
    }

    if (user.emailVerified) {
      return {
        success: false,
        message: 'Email já verificado!'
      };
    }

    await sendEmailVerification(user);
    
    console.log('✅ Email de verificação reenviado!');
    
    return {
      success: true,
      message: 'Email de verificação reenviado! Verifique sua caixa de entrada.'
    };
  } catch (error) {
    console.error('❌ Erro ao reenviar email de verificação:', error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

// ========== ALTERAR SENHA ==========

export async function changePassword(currentPassword, newPassword) {
  try {
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      return {
        success: false,
        message: 'Usuário não autenticado.'
      };
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    await updatePassword(user, newPassword);
    
    console.log('✅ Senha alterada com sucesso!');
    
    return {
      success: true,
      message: 'Senha alterada com sucesso!'
    };
  } catch (error) {
    console.error('❌ Erro ao alterar senha:', error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
}

// ========== MENSAGENS DE ERRO ==========

function getErrorMessage(errorCode) {
  const errors = {
    'auth/email-already-in-use': 'Este email já está cadastrado.',
    'auth/invalid-email': 'Email inválido.',
    'auth/operation-not-allowed': 'Operação não permitida.',
    'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres.',
    'auth/user-disabled': 'Esta conta foi desativada.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'Credenciais inválidas. Verifique email e senha.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
    'auth/popup-closed-by-user': 'Login cancelado.',
    'auth/popup-blocked': 'Popup bloqueado pelo navegador. Permitindo redirects...',
    'auth/cancelled-popup-request': 'Login cancelado.',
    'auth/requires-recent-login': 'Por segurança, faça login novamente para realizar esta ação.',
    'auth/account-exists-with-different-credential': 'Já existe uma conta com este email usando outro método de login.',
    'redirect-failed': 'Login não completado. Tente novamente.'
  };

  return errors[errorCode] || 'Erro desconhecido. Tente novamente.';
}

export default {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  handleRedirectResult,
  logout,
  resetPassword,
  resendVerificationEmail,
  changePassword
};