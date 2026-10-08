const { parseRss, normalizeAsOf, filterByAsOf, stableHash } = require('../lib/point-in-time');

function queryText(value) {
  return String(value || 'crypto markets').trim().slice(0, 120) || 'crypto markets';
}

module.exports = async function handler(req, res) {
  const query = queryText(req.query?.q);
  let asOf;
  try { asOf = normalizeAsOf(req.query?.asOf); } catch (error) { return res.status(400).json({ error: error.message }); }
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const retrievedAt = new Date().toISOString();
  try {
    const response = await fetch(rssUrl, { headers: { accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8' } });
    const xml = await response.text();
    if (!response.ok) throw new Error(`Research source returned HTTP ${response.status}`);
    const allItems = parseRss(xml);
    const pointInTimeItems = filterByAsOf(allItems, asOf).slice(0, 12).map(item => ({
      ...item,
      source: 'Google News RSS',
      contentHash: stableHash(item),
      evidenceStatus: 'published-before-cutoff',
    }));
    return res.status(200).json({
      query, asOf, retrievedAt, sourceUrl: rssUrl, source: 'Google News RSS',
      totalSeen: allItems.length, included: pointInTimeItems.length,
      excludedAfterCutoff: Math.max(0, allItems.length - filterByAsOf(allItems, asOf).length),
      items: pointInTimeItems,
      integrity: { pointInTime: true, hashed: true },
    });
  } catch (error) {
    return res.status(502).json({
      query, asOf, retrievedAt, source: 'Google News RSS',
      error: error.message,
      items: [],
      integrity: { pointInTime: false, hashed: false },
    });
  }
};
