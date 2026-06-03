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

function sourceLine(url) {
  if (!url) return body('');

  return new Paragraph({
    spacing: { before: 0, after: 160, line: 260 },
    children: [
      textRun('Source: ', { size: 18, bold: true, color: '555555' }),
      textRun(url, { size: 18, color: '555555' })
    ]
  });
}

async function generateReport(researchData, options = {}) {
  const now = options.date ? new Date(options.date) : new Date();
  const dateStr = getDateString(now);
  const displayDate = getDisplayDate(now);
  const outputDir = options.outputDir || process.env.OUTPUT_DIR || path.join(process.cwd(), 'outputs');
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
        body('Daily intelligence brief covering Silicon Valley AI topics and Wall Street / private equity AI investment dynamics.'),
        heading1('PART 1 | Silicon Valley AI Hot Topics'),
        ...(researchData.silicon_valley || []).flatMap(item => [
          heading2(item.topic),
          body(item.summary),
          sourceLine(item.source)
        ]),
        new Paragraph({ children: [new PageBreak()] }),
        heading1('PART 2 | Wall Street and PE Investment Dynamics'),
        ...(researchData.wall_street_pe || []).flatMap(item => [
          heading2(item.topic),
          body(item.summary),
          ...(item.amount ? [bullet(`Deal size: ${item.amount}`)] : []),
          sourceLine(item.source)
        ]),
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
