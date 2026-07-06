const nodemailer = require('nodemailer');
const { ImapFlow } = require('imapflow');

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

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function nextUtcDay(date) {
  const result = startOfUtcDay(date);
  result.setUTCDate(result.getUTCDate() + 1);
  return result;
}

async function resolveSentMailbox(client) {
  const mailboxes = await client.list();
  const sentMailbox = mailboxes.find(mailbox => mailbox.flags?.has('\\Sent'));
  return sentMailbox?.path || '[Gmail]/Sent Mail';
}

async function hasAlreadySent({ user, pass, to, subject, date }) {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false
  });

  await client.connect();
  try {
    const sentMailbox = await resolveSentMailbox(client);
    const lock = await client.getMailboxLock(sentMailbox);
    try {
      const sentOn = date ? new Date(date) : new Date();
      const matches = await client.search({
        subject,
        to,
        since: startOfUtcDay(sentOn),
        before: nextUtcDay(sentOn)
      });
      return matches.length > 0;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

async function sendEmail({ body, html, attachmentPath, date }) {
  const user = requireEnv('GMAIL_USER');
  const pass = requireEnv('GMAIL_APP_PASSWORD');
  const to = requireEnv('REPORT_RECIPIENT');
  const subject = formatSubject(date ? new Date(date) : new Date());

  try {
    if (await hasAlreadySent({ user, pass, to, subject, date })) {
      console.log(`Email already sent for subject "${subject}" to ${to}; skipping duplicate delivery.`);
      return { skipped: true, duplicate: true, subject };
    }
  } catch (error) {
    console.warn(`Duplicate-send guard could not inspect Gmail Sent: ${error.message}`);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });

  const message = {
    from: user,
    to,
    subject,
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

module.exports = { sendEmail, formatSubject, hasAlreadySent };
