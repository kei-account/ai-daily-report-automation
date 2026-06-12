const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageBreak,
  Paragraph,
  SimpleField,
  TextRun
} = require('docx');
const fs = require('fs');
const path = require('path');

function getDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getDisplayDate(date = new Date()) {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function textRun(text, options = {}) {
  return new TextRun({
    text,
    font: 'Arial',
    size: options.size || 22,
    bold: options.bold || false,
    italics: options.italics || false,
    color: options.color || '111111'
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '2E74B5', space: 4 }
    },
    children: [textRun(text, { size: 32, bold: true, color: '2E74B5' })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [textRun(text, { size: 26, bold: true, color: '1F4D78' })]
  });
}

function body(text) {
  return new Paragraph({
    spacing: { before: 0, after: 160, line: 280 },
    children: [textRun(text || '')]
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 0, after: 100, line: 280 },
    children: [textRun(text, { size: 20, color: '333333' })]
  });
}

function labeledParagraph(label, text) {
  return new Paragraph({
    spacing: { before: 0, after: 120, line: 280 },
    children: [
      textRun(`${label}: `, { size: 21, bold: true, color: '1F4D78' }),
      textRun(text || 'Not provided', { size: 21, color: '111111' })
    ]
  });
}

function formatSourceTime(value) {
  if (!value) return 'Not provided';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }) + ' JST';
}

function sourceLine(item) {
  const url = item.source;
  if (!url) return body('');

  return new Paragraph({
    spacing: { before: 0, after: 160, line: 260 },
    children: [
      textRun('Source time: ', { size: 18, bold: true, color: '555555' }),
      textRun(`${formatSourceTime(item.source_published_at)} | `, { size: 18, color: '555555' }),
      textRun('Source: ', { size: 18, bold: true, color: '555555' }),
      textRun(url, { size: 18, color: '555555' })
    ]
  });
}

function itemBlocks(item) {
  const topic = item.topic_en || item.topic;
  const summary = item.summary_en || item.summary;
  const impact = item.impact_en || item.impact || 'Needs continued monitoring for business and investment implications.';
  const keyFacts = Array.isArray(item.key_facts_en || item.key_facts)
    ? (item.key_facts_en || item.key_facts).filter(Boolean)
    : [item.key_facts_en || item.key_facts].filter(Boolean);
  const framework = item.framework_en || item.framework;
  const analysis = item.analysis_en || item.analysis;
  const forwardView = item.forward_view_en || item.forward_view;

  return [
    heading2(topic),
    labeledParagraph('Key point', summary),
    ...(keyFacts.length ? [
      labeledParagraph('Concrete facts', keyFacts.join('; '))
    ] : []),
    ...(framework ? [labeledParagraph('Analysis framework', framework)] : []),
    labeledParagraph('Impact', impact),
    ...(analysis ? [labeledParagraph('Professional analysis', analysis)] : []),
    ...(forwardView ? [labeledParagraph('Forward view', forwardView)] : []),
    ...(item.amount ? [bullet(`Deal size: ${item.amount}`)] : []),
    sourceLine(item)
  ];
}

function buildReportOpeningLine(researchData) {
  if (researchData.opening_line_en) return researchData.opening_line_en;
  if (researchData.opening_line) return researchData.opening_line;

  const aiItems = researchData.ai_technology || researchData.silicon_valley || [];
  const investmentItems = researchData.pe_investment || researchData.wall_street_pe || [];
  const aiLead = aiItems[0]?.topic_en || aiItems[0]?.topic || 'AI technology signals';
  const investmentLead = investmentItems[0]?.topic_en || investmentItems[0]?.topic || 'AI investment signals';

  return `Today's AI brief is led by ${aiLead}, while the capital side is watching ${investmentLead}. The key question is whether technical progress is turning into deployable products, measurable efficiency, and investable revenue.`;
}

function buildReportDailySummary(researchData, lookbackHours) {
  if (researchData.daily_summary_en) return researchData.daily_summary_en;
  if (researchData.daily_summary) return researchData.daily_summary;

  const aiItems = researchData.ai_technology || researchData.silicon_valley || [];
  const investmentItems = researchData.pe_investment || researchData.wall_street_pe || [];
  const aiLead = aiItems[0]?.topic_en || aiItems[0]?.topic || 'no single dominant AI technology signal';
  const investmentLead = investmentItems[0]?.topic_en || investmentItems[0]?.topic || 'no single dominant PE/investment signal';

  return `Over the last ${lookbackHours} hours, the main AI technology signal is "${aiLead}", while the main PE/investment signal is "${investmentLead}".`;
}

async function generateReport(researchData, options = {}) {
  const now = options.date ? new Date(options.date) : new Date();
  const dateStr = getDateString(now);
  const displayDate = getDisplayDate(now);
  const outputDir = options.outputDir || process.env.OUTPUT_DIR || path.join(process.cwd(), 'outputs');
  const lookbackHours = researchData.lookback_hours || 24;
  const openingLine = buildReportOpeningLine(researchData);
  const dailySummary = buildReportDailySummary(researchData, lookbackHours);
  fs.mkdirSync(outputDir, { recursive: true });

  const doc = new Document({
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: '•',
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: {
              indent: { left: 720, hanging: 360 }
            }
          }
        }]
      }]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              textRun(`AI Daily Report | ${displayDate} | Page `, { size: 18, color: '777777' }),
              new SimpleField('PAGE')
            ]
          })]
        })
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 80 },
          children: [textRun('AI Daily Intelligence Report', { size: 44, bold: true, color: '0B2545' })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 360 },
          children: [textRun(displayDate, { size: 24, color: '555555' })]
        }),
        body(`Daily intelligence brief based on sources published or updated within the last ${lookbackHours} hours.`),
        heading1('Opening Summary'),
        body(openingLine),
        heading1('Today at a Glance'),
        body(dailySummary),
        heading1('PART 1 | AI Technology'),
        ...(researchData.ai_technology || researchData.silicon_valley || []).flatMap(item => [
          ...itemBlocks(item)
        ]),
        new Paragraph({ children: [new PageBreak()] }),
        heading1('PART 2 | PE and Investment'),
        ...(researchData.pe_investment || researchData.wall_street_pe || []).flatMap(item => [
          ...itemBlocks(item)
        ]),
        heading1('Integrated View'),
        body(`Based on the last ${lookbackHours} hours of signals, the technology side should be read through deployability, agent workflows, infrastructure, and governance. The PE/investment side should be read through revenue conversion, efficiency gains, valuation support, and enterprise deployment opportunities.`),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 360 },
          children: [textRun('-- This report was generated automatically. --', {
            size: 18,
            italics: true,
            color: '888888'
          })]
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(outputDir, `AI_Daily_Report_${dateStr}.docx`);
  fs.writeFileSync(outPath, buffer);
  return outPath;
}

module.exports = { generateReport };
