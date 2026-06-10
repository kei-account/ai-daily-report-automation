const fs = require('fs');
const path = require('path');
const { generateReport } = require('./create_report');
const { generateChineseEmail, generateChineseEmailHtml } = require('./generate_email');

function resolveInputPath() {
  if (process.argv.includes('--example')) {
    return path.join(__dirname, '..', 'examples', 'research_data.example.json');
  }
  return path.join(process.cwd(), 'research_data.json');
}

async function main() {
  const inputPath = resolveInputPath();
  const researchData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  console.log('=== AI Daily Report generation ===');
  console.log(`Input: ${inputPath}`);

  const docPath = await generateReport(researchData, {
    date: researchData.date
  });
  console.log(`DOCX report: ${docPath}`);

  const emailBody = generateChineseEmail(researchData, {
    date: researchData.date
  });
  const emailPath = path.join(process.cwd(), 'email_body.txt');
  fs.writeFileSync(emailPath, emailBody);
  console.log(`Email body: ${emailPath}`);

  const emailHtml = generateChineseEmailHtml(researchData, {
    date: researchData.date
  });
  const emailHtmlPath = path.join(process.cwd(), 'email_body.html');
  fs.writeFileSync(emailHtmlPath, emailHtml);
  console.log(`Email HTML: ${emailHtmlPath}`);

  console.log('Done.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
