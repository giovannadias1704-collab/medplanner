import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, resetLink } = req.body

  try {
    await sgMail.send({
      to: email,
      from: 'seuemail@seudominio.com', // ⚠️ deve ser verificado no SendGrid
      subject: 'Recuperação de senha',
      html: `<p>Clique aqui para redefinir sua senha: <a href="${resetLink}">Redefinir senha</a></p>`,
    })
    res.status(200).json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}