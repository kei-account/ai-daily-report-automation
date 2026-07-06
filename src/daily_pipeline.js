const fs = require('fs');
const path = require('path');
const { fetchNews } = require('./fetch_news');
const { buildResearchData } = require('./llm_research');
const { generateReport } = require('./create_report');
const { generateChineseEmail, generateChineseEmailHtml } = require('./generate_email');
const { sendEmail } = require('./send_email');

function resolveReportDate() {
  const dateArg = process.argv.find(arg => arg.startsWith('--date='));
  const date = process.env.REPORT_DATE || (dateArg ? dateArg.slice('--date='.length) : '');

  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`REPORT_DATE must use YYYY-MM-DD format, got: ${date}`);
    }
    return date;
  }

  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const date = resolveReportDate();

  console.log(`Starting daily AI report pipeline for ${date}`);

  const newsBundle = await fetchNews({ date });
  console.log(`Fetched ${newsBundle.items.length} news items.`);

  const researchData = await buildResearchData(newsBundle);
  fs.writeFileSync('research_data.json', JSON.stringify(researchData, null, 2));
  console.log('Saved research_data.json.');

  const docPath = await generateReport(researchData, { date });
  console.log(`Generated DOCX: ${docPath}`);

  const emailBody = generateChineseEmail(researchData, { date });
  const emailPath = path.join(process.cwd(), 'email_body.txt');
  fs.writeFileSync(emailPath, emailBody);
  console.log(`Generated email body: ${emailPath}`);

  const emailHtml = generateChineseEmailHtml(researchData, { date });
  const emailHtmlPath = path.join(process.cwd(), 'email_body.html');
  fs.writeFileSync(emailHtmlPath, emailHtml);
  console.log(`Generated email HTML: ${emailHtmlPath}`);

  const info = await sendEmail({
    body: emailBody,
    html: emailHtml,
    attachmentPath: docPath,
    date
  });

  console.log(`Email sent: ${info.messageId || '(no message id returned)'}`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { main, resolveReportDate };
