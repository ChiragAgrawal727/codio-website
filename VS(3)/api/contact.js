const nodemailer = require('nodemailer');

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const missing = [];
  if (!user) missing.push('SMTP_USER');
  if (!pass) missing.push('SMTP_PASS');

  if (missing.length > 0) {
    throw new Error(`Missing SMTP configuration: ${missing.join(', ')}`);
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, service, budget, message } = req.body || {};

    if (!name || !email || !phone || !service || !budget || !message) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const toEmail = process.env.CONTACT_TO_EMAIL || 'chiragagr24@gmail.com';
    const fromEmail = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER;

    const transporter = getTransporter();
    await transporter.verify();

    await transporter.sendMail({
      from: `Codio Contact Form <${fromEmail}>`,
      to: toEmail,
      replyTo: email,
      subject: `New Inquiry from ${name} (${service})`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Service: ${service}`,
        `Budget: ${budget}`,
        '',
        'Message:',
        message,
      ].join('\n'),
      html: `
        <h2>New Contact Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Budget:</strong> ${budget}</p>
        <p><strong>Message:</strong><br/>${String(message).replace(/\n/g, '<br/>')}</p>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    const message = error && error.message ? error.message : 'Failed to send email';
    return res.status(500).json({ ok: false, error: message });
  }
};
