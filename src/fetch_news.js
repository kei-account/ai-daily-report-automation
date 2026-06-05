const fs = require('fs');
const Parser = require('rss-parser');

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'ai-daily-report-automation/0.1'
  }
});

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function uniqByLink(items) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = item.link || item.title;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function isWithinLastHours(isoDate, hours, now = new Date()) {
  if (!isoDate) return false;
  const published = new Date(isoDate);
  if (Number.isNaN(published.getTime())) return false;
  const ageMs = now.getTime() - published.getTime();
  return ageMs >= 0 && ageMs <= hours * 60 * 60 * 1000;
}

async function fetchFeed(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ai-daily-report-automation/0.1'
    },
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const feed = await parser.parseString(xml);
  return (feed.items || []).map(item => ({
    title: item.title || '',
    summary: item.contentSnippet || item.content || '',
    link: item.link || '',
    source: feed.title || url,
    published_at: normalizeDate(item.isoDate || item.pubDate)
  }));
}

async function fetchNews(options = {}) {
  const topicsPath = options.topicsPath || 'config/topics.json';
  const topics = JSON.parse(fs.readFileSync(topicsPath, 'utf8'));
  const feeds = topics.rss_feeds || [];
  const lookbackHours = options.lookbackHours || 24;
  const now = options.now ? new Date(options.now) : new Date();

  const batches = await Promise.allSettled(feeds.map(fetchFeed));
  const items = batches.flatMap(result => (result.status === 'fulfilled' ? result.value : []));
  const recentItems = items.filter(item => isWithinLastHours(item.published_at, lookbackHours, now));

  return {
    date: options.date || new Date().toISOString().slice(0, 10),
    lookback_hours: lookbackHours,
    generated_at: now.toISOString(),
    queries: {
      ai_technology: topics.ai_technology || topics.silicon_valley || [],
      pe_investment: topics.pe_investment || topics.wall_street_pe || []
    },
    items: uniqByLink(recentItems)
      .sort((a, b) => String(b.published_at || '').localeCompare(String(a.published_at || '')))
      .slice(0, 40)
  };
}

module.exports = { fetchNews, isWithinLastHours };
