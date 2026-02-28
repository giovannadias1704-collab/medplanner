// services/emailService.js
import emailjs from '@emailjs/browser';

// ─── Configuração ─────────────────────────────────────────────────────────────
// Substitua com suas chaves do EmailJS (https://dashboard.emailjs.com)
const EMAILJS_CONFIG = {
  publicKey:          import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  serviceId:          import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templates: {
    welcome:          import.meta.env.VITE_EMAILJS_TEMPLATE_WELCOME,
    notification:     import.meta.env.VITE_EMAILJS_TEMPLATE_NOTIFICATION,
    passwordReset:    import.meta.env.VITE_EMAILJS_TEMPLATE_PASSWORD_RESET, // opcional, Firebase já faz isso
  },
};

// Inicializa o EmailJS uma vez
emailjs.init(EMAILJS_CONFIG.publicKey);

// ─── Função base ──────────────────────────────────────────────────────────────
async function sendEmail(templateId, templateParams) {
  try {
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      templateId,
      templateParams
    );
    console.log(`[EmailService] Email enviado com sucesso:`, response.status);
    return { success: true, response };
  } catch (error) {
    console.error('[EmailService] Falha ao enviar email:', error);
    return { success: false, error };
  }
}

// ─── Emails específicos ───────────────────────────────────────────────────────

/**
 * Email de boas-vindas enviado logo após o cadastro
 * @param {Object} user - { displayName, email }
 */
export async function sendWelcomeEmail(user) {
  return sendEmail(EMAILJS_CONFIG.templates.welcome, {
    to_name:  user.displayName || 'Usuário',
    to_email: user.email,
    app_name: 'Meu App', // troque pelo nome do seu app
  });
}

/**
 * Notificação genérica do sistema
 * @param {Object} params
 * @param {string} params.toEmail     - Email do destinatário
 * @param {string} params.toName      - Nome do destinatário
 * @param {string} params.subject     - Assunto da notificação
 * @param {string} params.message     - Corpo da mensagem
 */
export async function sendNotificationEmail({ toEmail, toName, subject, message }) {
  return sendEmail(EMAILJS_CONFIG.templates.notification, {
    to_name:  toName  || 'Usuário',
    to_email: toEmail,
    subject,
    message,
    app_name: 'Meu App', // troque pelo nome do seu app
  });
}

/**
 * Recuperação de senha — usa o Firebase nativamente (mais confiável)
 * Mantido aqui apenas para referência e consistência
 * @param {string} email
 */
export async function sendPasswordResetEmail_Firebase(email) {
  const { auth } = await import('./firebase');
  const { sendPasswordResetEmail } = await import('firebase/auth');
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('[EmailService] Email de recuperação enviado via Firebase');
    return { success: true };
  } catch (error) {
    console.error('[EmailService] Falha ao enviar recuperação de senha:', error);
    return { success: false, error };
  }
}