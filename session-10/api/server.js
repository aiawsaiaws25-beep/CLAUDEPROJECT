// Sandbox review-item API for the Session 10 Copilot Studio agent.
// No dependencies. Items are kept in memory, so a restart empties the queue.
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.API_KEY || 'session10-demo-key';

const EXCEPTION_TYPES = ['NoPO', 'QuantityMismatch', 'PriceVariance', 'PossibleDuplicate', 'BankDetailMismatch', 'NewVendor', 'BlockedVendor'];
const SEVERITIES = ['High', 'Medium', 'Low'];
const items = [];
let counter = 1000;

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

function validate(b) {
  const errors = [];
  const text = (f) => { if (typeof b[f] !== 'string' || !b[f].trim()) errors.push(`${f} is required`); };
  ['title', 'invoiceNumber', 'vendorName', 'recommendedAction'].forEach(text);
  if (typeof b.amountAED !== 'number' || !(b.amountAED >= 0)) errors.push('amountAED must be a number >= 0');
  if (!EXCEPTION_TYPES.includes(b.exceptionType)) errors.push(`exceptionType must be one of ${EXCEPTION_TYPES.join(', ')}`);
  if (!SEVERITIES.includes(b.severity)) errors.push(`severity must be one of ${SEVERITIES.join(', ')}`);
  if (!Array.isArray(b.evidence) || b.evidence.length === 0) errors.push('evidence must contain at least one item');
  else b.evidence.forEach((e, i) => {
    if (!e || typeof e.source !== 'string' || !e.source.trim()) errors.push(`evidence[${i}].source is required`);
    if (!e || typeof e.excerpt !== 'string' || !e.excerpt.trim()) errors.push(`evidence[${i}].excerpt is required`);
  });
  return errors;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 100000) reject(new Error('too large')); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function queuePage() {
  const rows = items.slice().reverse().map((i) => `<tr><td>${esc(i.id)}</td><td>${esc(i.createdAt.slice(0, 19).replace('T', ' '))}</td><td>${esc(i.severity)}</td><td>${esc(i.exceptionType)}</td><td>${esc(i.title)}</td><td>${esc(i.amountAED)}</td><td>${i.evidence.map((e) => esc(e.source)).join('<br>')}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="10"><title>Review queue (sandbox)</title>
<style>body{font-family:system-ui,sans-serif;margin:24px;color:#222}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top;font-size:14px}th{background:#f3f3f3}</style></head>
<body><h1>AP review queue (sandbox)</h1><p>${items.length} item(s). Refreshes every 10 seconds. Restarting the app clears the queue.</p>
<table><tr><th>ID</th><th>Created (UTC)</th><th>Severity</th><th>Type</th><th>Title</th><th>Amount AED</th><th>Evidence</th></tr>${rows || '<tr><td colspan="7">No items yet.</td></tr>'}</table></body></html>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (req.method === 'GET' && path === '/') return send(res, 200, queuePage(), 'text/html; charset=utf-8');
  if (req.method === 'GET' && path === '/health') return send(res, 200, { status: 'ok', items: items.length });

  if (path.startsWith('/api/')) {
    if (req.headers['x-api-key'] !== API_KEY) return send(res, 401, { error: 'Missing or wrong x-api-key header' });

    if (req.method === 'POST' && path === '/api/review-items') {
      let body;
      try { body = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'Body must be valid JSON' }); }
      const errors = validate(body || {});
      if (errors.length) return send(res, 400, { error: 'Validation failed', details: errors });
      const item = {
        id: `RVW-${++counter}`,
        status: 'Open',
        createdAt: new Date().toISOString(),
        title: body.title.trim(),
        invoiceNumber: body.invoiceNumber.trim(),
        vendorName: body.vendorName.trim(),
        amountAED: body.amountAED,
        exceptionType: body.exceptionType,
        severity: body.severity,
        evidence: body.evidence.map((e) => ({ source: e.source.trim(), excerpt: e.excerpt.trim() })),
        recommendedAction: body.recommendedAction.trim(),
      };
      items.push(item);
      return send(res, 201, item);
    }
    if (req.method === 'GET' && path === '/api/review-items') return send(res, 200, { items });
    const m = path.match(/^\/api\/review-items\/([\w-]+)$/);
    if (req.method === 'GET' && m) {
      const item = items.find((i) => i.id === m[1]);
      return item ? send(res, 200, item) : send(res, 404, { error: `No review item ${m[1]}` });
    }
  }
  send(res, 404, { error: 'Not found' });
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`Review-item sandbox API listening on port ${PORT}`));
}
module.exports = server;
