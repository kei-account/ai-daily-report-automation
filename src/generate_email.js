const fs = require('fs');

function formatAmount(amount) {
  return amount ? `\n   规模：${amount}` : '';
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

function formatSectionItem(item, index) {
  return `${index + 1}. ${item.topic}${formatAmount(item.amount)}
   要点：${item.summary}
   影响：${item.impact || '需继续观察其对产品策略、资本配置和企业采用节奏的影响。'}
   来源时间：${formatSourceTime(item.source_published_at)}
   来源：${item.source || '未提供'}`;
}

function buildDailySummary(researchData, lookbackHours) {
  if (researchData.daily_summary) return researchData.daily_summary;

  const aiItems = researchData.ai_technology || researchData.silicon_valley || [];
  const investmentItems = researchData.pe_investment || researchData.wall_street_pe || [];
  const aiLead = aiItems[0]?.topic || 'AI 技术侧暂无明确单一主线';
  const investmentLead = investmentItems[0]?.topic || 'PE / 投资侧暂无明确单一主线';

  return `过去 ${lookbackHours} 小时内，AI 技术侧的主要信号是「${aiLead}」；PE / 投资侧的主要信号是「${investmentLead}」。整体来看，今日信息更适合从“技术能否形成可部署能力”与“资本是否看到可计价回报”两条线并行观察。`;
}

function buildOpeningLine(researchData) {
  if (researchData.opening_line) return researchData.opening_line;

  const aiItems = researchData.ai_technology || researchData.silicon_valley || [];
  const investmentItems = researchData.pe_investment || researchData.wall_street_pe || [];
  const aiLead = aiItems[0]?.topic;
  const investmentLead = investmentItems[0]?.topic;

  if (aiLead && investmentLead) {
    return `今天的 AI 新闻像一场双线直播：技术侧盯着「${aiLead}」，资本侧盯着「${investmentLead}」，热闹但值得挑重点看。`;
  }
  if (aiLead) {
    return `今天 AI 技术侧的镜头比较集中：「${aiLead}」成了最值得先看的那条线。`;
  }
  if (investmentLead) {
    return `今天资本侧先举手：「${investmentLead}」提醒我们，AI 故事最后还是要落到钱和效率上。`;
  }
  return '今天的 AI 新闻不算喧哗，但仍值得从技术和资本两条线快速扫一遍。';
}

function generateChineseEmail(researchData, options = {}) {
  const recipientName = options.recipientName || process.env.REPORT_RECIPIENT_NAME || 'yidan';
  const now = options.date ? new Date(options.date) : new Date();
  const todayZh = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const aiTechnology = (researchData.ai_technology || researchData.silicon_valley || [])
    .map(formatSectionItem)
    .join('\n\n');

  const peInvestment = (researchData.pe_investment || researchData.wall_street_pe || [])
    .map(formatSectionItem)
    .join('\n\n');
  const lookbackHours = researchData.lookback_hours || 24;
  const generatedAt = formatSourceTime(researchData.generated_at || now.toISOString());
  const dailySummary = buildDailySummary(researchData, lookbackHours);
  const openingLine = buildOpeningLine(researchData);

  return `${recipientName}，早上好。

${openingLine}

以下是 ${todayZh} 的 AI 日报。本期只整理过去 ${lookbackHours} 小时内发布或更新的信息源，并在每条新闻下标注来源时间。生成时间：${generatedAt}。

一、今日核心摘要
${dailySummary}

二、AI 技术角度
${aiTechnology || '过去 24 小时内暂无足够可靠的新信息。'}

三、PE / 投资角度
${peInvestment || '过去 24 小时内暂无足够可靠的新信息。'}

四、综合判断
基于过去 ${lookbackHours} 小时的信息，AI 技术侧的重点仍在可部署能力、Agent 工作流、算力/平台基础设施和合规治理；PE/投资侧则更关注这些技术能否转化为收入、效率、估值支撑和企业级部署机会。短期内，真正值得跟踪的不是“AI 是否热门”，而是哪些新消息能证明技术正在变成可购买、可扩张、可计价的商业能力。

以上供参考。

AI Daily Report 编辑部`;
}

if (require.main === module) {
  const inputPath = process.argv[2] || 'research_data.json';
  const researchData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  fs.writeFileSync('email_body.txt', generateChineseEmail(researchData));
  console.log('Email body saved: email_body.txt');
}

module.exports = { generateChineseEmail };
