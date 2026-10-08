import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parseRss, filterByAsOf, stableHash } = require('../lib/point-in-time');

test('filters future evidence at the as-of boundary', () => {
  const items = [
    { title: 'future', url: 'https://example.com/future', publishedAt: '2026-10-08T12:01:00.000Z' },
    { title: 'past', url: 'https://example.com/past', publishedAt: '2026-10-08T11:59:00.000Z' },
  ];
  const result = filterByAsOf(items, '2026-10-08T12:00:00.000Z');
  assert.deepEqual(result.map(item => item.title), ['past']);
});

test('parses RSS fields and keeps a stable evidence hash', () => {
  const xml = '<rss><channel><item><title><![CDATA[BTC &amp; rates]]></title><link>https://example.com/a</link><pubDate>Thu, 08 Oct 2026 11:59:00 GMT</pubDate><description>Short update</description></item></channel></rss>';
  const [item] = parseRss(xml);
  assert.equal(item.title, 'BTC & rates');
  assert.equal(item.publishedAt, '2026-10-08T11:59:00.000Z');
  assert.equal(stableHash(item), stableHash(item));
});
