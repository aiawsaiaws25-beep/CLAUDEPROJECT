// Smoke test: node test.js
const assert = require('assert');
process.env.API_KEY = 'test-key';
const server = require('./server');

const sample = {
  title: 'Price variance - INV-10442 - Gulf Office Supplies',
  invoiceNumber: 'INV-10442', vendorName: 'Gulf Office Supplies', amountAED: 41200,
  exceptionType: 'PriceVariance', severity: 'Medium',
  evidence: [{ source: 'FIN-POL-007 section 3', excerpt: 'Variance above 2% or AED 500, whichever is lower, is a price variance exception.' }],
  recommendedAction: 'Confirm the agreed unit price with Procurement before payment.',
};

server.listen(0, async () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = (method, path, body, key = 'test-key') => fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(key ? { 'x-api-key': key } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  try {
    assert.equal((await call('GET', '/health', null, null)).status, 200);
    assert.equal((await call('POST', '/api/review-items', sample, null)).status, 401);
    const bad = await call('POST', '/api/review-items', { ...sample, severity: 'Urgent', evidence: [] });
    assert.equal(bad.status, 400);
    assert.equal((await bad.json()).details.length, 2);
    const created = await call('POST', '/api/review-items', sample);
    assert.equal(created.status, 201);
    const item = await created.json();
    assert.match(item.id, /^RVW-\d+$/);
    assert.equal(item.status, 'Open');
    assert.equal((await (await call('GET', `/api/review-items/${item.id}`)).json()).invoiceNumber, 'INV-10442');
    assert.equal((await (await call('GET', '/api/review-items')).json()).items.length, 1);
    assert.equal((await call('GET', '/api/review-items/RVW-9')).status, 404);
    assert.match(await (await call('GET', '/', null, null)).text(), /INV-10442|Gulf Office Supplies/);
    console.log('All tests passed');
  } catch (e) { console.error(e); process.exitCode = 1; } finally { server.close(); }
});
