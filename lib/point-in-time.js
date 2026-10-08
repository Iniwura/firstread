const crypto = require('node:crypto');

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function tagValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
}

function parseRss(xml) {
  const items = [];
  for (const block of xml.match(/<item[\s\S]*?<\/item>/gi) || []) {
    const title = tagValue(block, 'title');
    const url = tagValue(block, 'link') || tagValue(block, 'guid');
    const publishedAt = tagValue(block, 'pubDate') || tagValue(block, 'published');
    const description = tagValue(block, 'description').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const timestamp = Date.parse(publishedAt);
    if (!title || !url || !Number.isFinite(timestamp)) continue;
    items.push({ title, url, publishedAt: new Date(timestamp).toISOString(), description });
  }
  return items;
}

function normalizeAsOf(value, fallback = new Date()) {
  const timestamp = value ? Date.parse(value) : fallback.getTime();
  if (!Number.isFinite(timestamp)) throw new Error('Invalid asOf timestamp');
  return new Date(timestamp).toISOString();
}

function filterByAsOf(items, asOf) {
  const cutoff = Date.parse(asOf);
  if (!Number.isFinite(cutoff)) throw new Error('Invalid asOf timestamp');
  return items
    .filter(item => Date.parse(item.publishedAt) <= cutoff)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

function stableHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

module.exports = { decodeXml, parseRss, normalizeAsOf, filterByAsOf, stableHash };
