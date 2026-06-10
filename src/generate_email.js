const fs = require('fs');

function formatAmount(amount) {
  return amount ? amount : '未披露';
}

function formatSourceTime(value) {
  if (!value) return '未提供';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }) + ' JST';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDailySummary(researchData, lookbackHours) {
  if (researchData.daily_summary_zh) return researchData.daily_summary_zh;
  if (researchData.daily_summary) return researchData.daily_summary;

  const aiItems = researchData.ai_technology || researchData.silicon_valley || [];
  const investmentItems = researchData.pe_investment || researchData.wall_street_pe || [];
  const aiLead = aiItems[0]?.topic || 'AI 技术侧暂无明确单一主线';
  const investmentLead = investmentItems[0]?.topic || 'PE / 投资侧暂无明确单一主线';

  return `过去 ${lookbackHours} 小时内，AI 技术侧的主要信号是「${aiLead}」；PE / 投资侧的主要信号是「${investmentLead}」。整体来看，今日信息更适合从“技术能否形成可部署能力”与“资本是否看到可计价回报”两条线并行观察。`;
}

function buildOpeningLine(researchData) {
  if (researchData.opening_line_zh) return researchData.opening_line_zh;
  if (researchData.opening_line) return researchData.opening_line;

  const aiItems = researchData.ai_technology || researchData.silicon_valley || [];
  const investmentItems = researchData.pe_investment || researchData.wall_street_pe || [];
  const aiLead = aiItems[0]?.topic;
  const investmentLead = investmentItems[0]?.topic;

  if (aiLead && investmentLead) {
    return `今天的 AI 新闻像一场双线直播：技术侧盯着「${aiLead}」，资本侧盯着「${investmentLead}」。热闹归热闹，但重点不是谁喊得最大声，而是谁能把模型、产品和钱真正串起来。今天这份日报，就按“技术有没有落地、资本有没有买账”两条线来看。`;
  }
  if (aiLead) {
    return `今天 AI 技术侧的镜头比较集中：「${aiLead}」成了最值得先看的那条线。资本侧虽然没有同样强的单点信号，但这不代表安静，更多像是在等技术交一份更硬的成绩单。今天先看技术怎么往前走，再看市场会不会跟上。`;
  }
  if (investmentLead) {
    return `今天资本侧先举手：「${investmentLead}」提醒我们，AI 故事最后还是要落到钱和效率上。技术侧如果没有足够强的新信号，投资人就会更盯收入、部署和回报。今天的重点，是资本到底在为什么样的 AI 买单。`;
  }
  return '今天的 AI 新闻不算喧哗，但安静不等于没变化。技术侧看有没有新能力进入真实场景，资本侧看有没有新资金继续下注。今天适合少看口号，多看落地和回报。';
}

function getEmailContext(researchData, options = {}) {
  const recipientName = options.recipientName || process.env.REPORT_RECIPIENT_NAME || 'yidan';
  const now = options.date ? new Date(options.date) : new Date();
  const todayZh = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  const lookbackHours = researchData.lookback_hours || 24;

  return {
    recipientName,
    todayZh,
    lookbackHours,
    generatedAt: formatSourceTime(researchData.generated_at || now.toISOString()),
    dailySummary: buildDailySummary(researchData, lookbackHours),
    openingLine: buildOpeningLine(researchData),
    aiItems: researchData.ai_technology || researchData.silicon_valley || [],
    investmentItems: researchData.pe_investment || researchData.wall_street_pe || []
  };
}

function formatTextItem(item, index, label) {
  const topic = item.topic_zh || item.topic;
  const summary = item.summary_zh || item.summary;
  const impact = item.impact_zh || item.impact || '需继续观察其对产品策略、资本配置和企业采用节奏的影响。';

  return [
    `${index + 1}. ${topic}`,
    `   ${label}${item.amount ? ` / 规模：${formatAmount(item.amount)}` : ''}`,
    `   要点：${summary}`,
    `   影响：${impact}`,
    `   来源时间：${formatSourceTime(item.source_published_at)}`,
    `   来源：${item.source || '未提供'}`
  ].join('\n');
}

function generateChineseEmail(researchData, options = {}) {
  const {
    recipientName,
    todayZh,
    lookbackHours,
    generatedAt,
    dailySummary,
    openingLine,
    aiItems,
    investmentItems
  } = getEmailContext(researchData, options);

  const aiTechnology = aiItems
    .map((item, index) => formatTextItem(item, index, 'AI 技术'))
    .join('\n\n');
  const peInvestment = investmentItems
    .map((item, index) => formatTextItem(item, index, 'PE / 投资'))
    .join('\n\n');

  return `${recipientName}，早上好。

${openingLine}

AI Daily Report
${todayZh}

今日的信息总结
${dailySummary}

AI 技术
${aiTechnology || '过去 24 小时内暂无足够可靠的新信息。'}

PE / 投资
${peInvestment || '过去 24 小时内暂无足够可靠的新信息。'}

综合判断
基于过去 ${lookbackHours} 小时的信息，AI 技术侧的重点仍在可部署能力、Agent 工作流、算力/平台基础设施和合规治理；PE/投资侧则更关注这些技术能否转化为收入、效率、估值支撑和企业级部署机会。

时间范围：过去 ${lookbackHours} 小时
生成时间：${generatedAt}
附件：完整 Word 日报

以上供参考。

AI Daily Report 编辑部`;
}

function itemCard(item, index, label, accentColor, bgColor) {
  const topic = item.topic_zh || item.topic;
  const summary = item.summary_zh || item.summary;
  const impact = item.impact_zh || item.impact || '需继续观察其对产品策略、资本配置和企业采用节奏的影响。';
  const source = item.source || '';
  const sourceHtml = source
    ? `<a href="${escapeHtml(source)}" style="color:#2563eb;text-decoration:none;">查看来源</a>`
    : '未提供';

  return `
    <tr>
      <td style="padding:0 0 14px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:14px;background:#ffffff;">
          <tr>
            <td style="padding:16px 18px 14px 18px;">
              <div style="margin-bottom:10px;">
                <span style="display:inline-block;padding:4px 9px;border-radius:999px;background:${bgColor};color:${accentColor};font-size:12px;font-weight:700;line-height:1;">${escapeHtml(label)}</span>
                <span style="color:#9ca3af;font-size:12px;margin-left:8px;">#${index + 1}</span>
                ${item.amount ? `<span style="display:inline-block;margin-left:8px;color:#374151;font-size:12px;">规模：${escapeHtml(formatAmount(item.amount))}</span>` : ''}
              </div>
              <div style="font-size:17px;line-height:1.45;font-weight:700;color:#111827;margin-bottom:8px;">${escapeHtml(topic)}</div>
              <div style="font-size:14px;line-height:1.7;color:#374151;margin-bottom:10px;">${escapeHtml(summary)}</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb;border-radius:10px;">
                <tr>
                  <td style="padding:10px 12px;font-size:13px;line-height:1.65;color:#4b5563;">
                    <strong style="color:#111827;">影响：</strong>${escapeHtml(impact)}
                  </td>
                </tr>
              </table>
              <div style="font-size:12px;line-height:1.6;color:#6b7280;margin-top:10px;">来源时间：${escapeHtml(formatSourceTime(item.source_published_at))} · ${sourceHtml}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function sectionTable(title, subtitle, items, label, accentColor, bgColor, emptyText) {
  const itemRows = items.length
    ? items.map((item, index) => itemCard(item, index, label, accentColor, bgColor)).join('')
    : `<tr><td style="padding:14px 0;font-size:14px;line-height:1.7;color:#6b7280;">${escapeHtml(emptyText)}</td></tr>`;

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;">
      <tr>
        <td style="padding-bottom:10px;">
          <div style="font-size:20px;line-height:1.35;font-weight:800;color:#111827;">${escapeHtml(title)}</div>
          <div style="font-size:13px;line-height:1.6;color:#6b7280;margin-top:3px;">${escapeHtml(subtitle)}</div>
        </td>
      </tr>
      ${itemRows}
    </table>`;
}

function generateChineseEmailHtml(researchData, options = {}) {
  const {
    recipientName,
    todayZh,
    lookbackHours,
    generatedAt,
    dailySummary,
    openingLine,
    aiItems,
    investmentItems
  } = getEmailContext(researchData, options);

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans SC','Microsoft YaHei',Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f4;padding:24px 0;">
      <tr>
        <td align="center" style="padding:0 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e7e5e4;">
            <tr>
              <td style="padding:26px 28px 22px 28px;background:#fafaf9;border-bottom:1px solid #e7e5e4;">
                <div style="font-size:13px;line-height:1.4;color:#78716c;margin-bottom:8px;">${escapeHtml(todayZh)} · 过去 ${lookbackHours} 小时</div>
                <div style="font-size:30px;line-height:1.2;font-weight:850;color:#111827;letter-spacing:0;">AI Daily Report</div>
                <div style="font-size:15px;line-height:1.75;color:#44403c;margin-top:14px;">${escapeHtml(recipientName)}，早上好。${escapeHtml(openingLine)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 26px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border-left:4px solid #0f766e;border-radius:14px;margin-bottom:20px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <div style="font-size:13px;font-weight:800;color:#0f766e;margin-bottom:6px;">今日信息总结</div>
                      <div style="font-size:16px;line-height:1.75;color:#1f2937;">${escapeHtml(dailySummary)}</div>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:6px;">
                  <tr>
                    <td style="padding:10px 12px;background:#f9fafb;border-radius:12px;font-size:13px;line-height:1.6;color:#4b5563;">
                      <strong style="color:#111827;">生成时间</strong>：${escapeHtml(generatedAt)}
                      <span style="color:#d1d5db;">　|　</span>
                      <strong style="color:#111827;">附件</strong>：完整 Word 日报
                    </td>
                  </tr>
                </table>

                ${sectionTable('AI 技术', '看能力是否进入真实产品和工作流。', aiItems, 'TECH', '#0f766e', '#ccfbf1', '过去 24 小时内暂无足够可靠的新信息。')}
                ${sectionTable('PE / 投资', '看资本是否继续为收入、效率和部署确定性买单。', investmentItems, 'CAPITAL', '#7c3aed', '#ede9fe', '过去 24 小时内暂无足够可靠的新信息。')}

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;background:#111827;border-radius:16px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <div style="font-size:14px;font-weight:800;color:#ffffff;margin-bottom:8px;">综合判断</div>
                      <div style="font-size:14px;line-height:1.8;color:#e5e7eb;">基于过去 ${lookbackHours} 小时的信息，AI 技术侧的重点仍在可部署能力、Agent 工作流、算力/平台基础设施和合规治理；PE/投资侧则更关注这些技术能否转化为收入、效率、估值支撑和企业级部署机会。</div>
                    </td>
                  </tr>
                </table>

                <div style="font-size:12px;line-height:1.6;color:#9ca3af;margin-top:20px;">以上供参考。<br>AI Daily Report 编辑部</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

if (require.main === module) {
  const inputPath = process.argv[2] || 'research_data.json';
  const researchData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  fs.writeFileSync('email_body.txt', generateChineseEmail(researchData));
  fs.writeFileSync('email_body.html', generateChineseEmailHtml(researchData));
  console.log('Email body saved: email_body.txt');
  console.log('Email HTML saved: email_body.html');
}

module.exports = {
  buildDailySummary,
  buildOpeningLine,
  formatSourceTime,
  generateChineseEmail,
  generateChineseEmailHtml
};
