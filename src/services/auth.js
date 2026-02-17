import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';

// ========== REGISTRO ==========

export async function registerWithEmail(email, password, displayName) {
  try {
    // Criar usuário
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Atualizar perfil com nome
    await updateProfile(user, { displayName });

    // Enviar email de verificação
    await sendEmailVerification(user);

    // Criar documento do usuário no Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      photoURL: user.photoURL || null,
      emailVerified: false,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      provider: 'email',
      subscription: {
        plan: 'free',
        status: 'active',
        startDate: serverTimestamp()
      }
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

    // Atualizar último login
    await setDoc(doc(db, 'users', user.uid), {
      lastLoginAt: serverTimestamp()
    }, { merge: true });

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

// ========== LOGIN COM GOOGLE ==========

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Verificar se é novo usuário
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Criar documento para novo usuário Google
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        provider: 'google',
        subscription: {
          plan: 'free',
          status: 'active',
          startDate: serverTimestamp()
        }
      });
    } else {
      // Atualizar último login
      await setDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp()
      }, { merge: true });
    }

    console.log('✅ Login com Google realizado com sucesso!');
    
    return {
      success: true,
      user: user,
      isNewUser: !userDoc.exists()
    };
  } catch (error) {
    console.error('❌ Erro ao fazer login com Google:', error);
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

    // Reautenticar usuário
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Alterar senha
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
    'auth/popup-closed-by-user': 'Janela de login fechada. Tente novamente.',
    'auth/cancelled-popup-request': 'Login cancelado.',
    'auth/requires-recent-login': 'Por segurança, faça login novamente para realizar esta ação.'
  };

  return errors[errorCode] || 'Erro desconhecido. Tente novamente.';
}

export default {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logout,
  resetPassword,
  resendVerificationEmail,
  changePassword
};