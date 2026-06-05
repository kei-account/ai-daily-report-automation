const fs = require('fs');
const path = require('path');
const { fetchNews } = require('./fetch_news');
const { buildResearchData } = require('./llm_research');
const { generateReport } = require('./create_report');
const { generateChineseEmail } = require('./generate_email');
const { sendEmail } = require('./send_email');

async function main() {
  const date = new Date().toISOString().slice(0, 10);

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

  const info = await sendEmail({
    body: emailBody,
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

module.exports = { main };
