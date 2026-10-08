#!/usr/bin/env node
/**
 * Phase 0 source reachability probe. Read-only; writes raw response metadata.
 * The MCP backend is recorded separately from MCP transport/catalog reachability.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bitgetBase = 'https://api.bitget.com';
const mcpUrl = 'https://agent.bitget.com/mcp';
const fetchedAt = new Date().toISOString();

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, { headers: { accept: 'application/json', ...options.headers }, ...options });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 4000) }; }
  return { url, httpStatus: response.status, ok: response.ok, body, rawText: text, sessionId: response.headers.get('mcp-session-id') };
}

async function mcpRequest(sessionId, id, method, params = {}) {
  const headers = { accept: 'application/json, text/event-stream', 'content-type': 'application/json' };
  if (sessionId) headers['mcp-session-id'] = sessionId;
  const result = await jsonFetch(mcpUrl, { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) });
  const session = result.sessionId;
  const match = String(result.rawText ?? '').match(/data:\s*(\{[\s\S]*\})/);
  let message = null;
  if (match) { try { message = JSON.parse(match[1]); } catch {} }
  return { ...result, sessionId: session, message };
}

const directPaths = [
  '/api/v3/reality/market/stock-info?symbol=RNVDAUSDT',
  '/api/v3/reality/market/states',
  '/api/v3/reality/market/calendar',
  '/api/v3/market/instruments?category=SPOT&symbol=RNVDAUSDT',
];
const direct = [];
for (const relative of directPaths) direct.push(await jsonFetch(`${bitgetBase}${relative}`));

const init = await mcpRequest(null, 1, 'initialize', {
  protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'firstread-phase0', version: '0.1.0' },
});
let mcp = { endpoint: mcpUrl, initialize: init };
if (init.message?.result && init.sessionId) {
  await mcpRequest(init.sessionId, null, 'notifications/initialized');
  const tools = await mcpRequest(init.sessionId, 2, 'tools/list');
  const guide = await mcpRequest(init.sessionId, 3, 'tools/call', { name: 'guide', arguments: { category: 'equity' } });
  const liveQuery = await mcpRequest(init.sessionId, 4, 'tools/call', { name: 'do_query', arguments: { entry_id: 'equity_profile', params: { symbol: 'NVDA' } } });
  mcp = { endpoint: mcpUrl, server: init.message.result.serverInfo, initialize: init.message, tools: tools.message, equityGuide: guide.message, liveQuery: liveQuery.message };
}

const report = {
  project: 'FIRSTREAD',
  fetchedAt,
  directReality: {
    endpoints: direct,
    allSuccessful: direct.every((entry) => entry.ok && entry.body?.code === '00000'),
    schema: 'Bitget REST envelope { code, msg, requestTime, data }',
  },
  fundamentalsMcp: {
    ...mcp,
    transportReachable: Boolean(mcp.initialize?.result),
    catalogReachable: Boolean(mcp.tools?.result?.tools),
    equityCatalogReachable: Boolean(mcp.equityGuide?.result),
    backendQuerySuccessful: Boolean(mcp.liveQuery?.result && !mcp.liveQuery.result.isError && !JSON.stringify(mcp.liveQuery).includes('"status_code":503')),
    limitation: 'The public MCP transport and catalog were reachable; the live equity profile query returned backend HTTP 503 during the probe. No fundamentals are fabricated or cached as successful.',
  },
};
await mkdir(path.join(root, 'reports'), { recursive: true });
const reportPath = path.join(root, 'reports/source-feasibility.json');
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ report: reportPath, realityPass: report.directReality.allSuccessful, mcpTransport: report.fundamentalsMcp.transportReachable, mcpCatalog: report.fundamentalsMcp.catalogReachable, mcpBackend: report.fundamentalsMcp.backendQuerySuccessful }, null, 2));
if (!report.directReality.allSuccessful || !report.fundamentalsMcp.transportReachable || !report.fundamentalsMcp.catalogReachable) process.exitCode = 1;
