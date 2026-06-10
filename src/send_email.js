const nodemailer = require('nodemailer');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function formatSubject(date = new Date()) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `【AI日报】硅谷与华尔街AI动态速报 — ${month}月${day}日`;
}

async function sendEmail({ body, html, attachmentPath, date }) {
  const user = requireEnv('GMAIL_USER');
  const pass = requireEnv('GMAIL_APP_PASSWORD');
  const to = requireEnv('REPORT_RECIPIENT');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });

  const message = {
    from: user,
    to,
    subject: formatSubject(date ? new Date(date) : new Date()),
    text: body
  };

  if (html) {
    message.html = html;
  }

  if (attachmentPath) {
    message.attachments = [{ path: attachmentPath }];
  }

  const info = await transporter.sendMail(message);
  return info;
}

module.exports = { sendEmail, formatSubject };
