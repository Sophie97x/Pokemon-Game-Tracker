const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

process.env.RATE_LIMIT_MAX = '10';
process.env.RATE_LIMIT_WINDOW_MS = '60000';

const { app, pool } = require('../server');

const request = (server, { method = 'GET', path, headers = {}, body } = {}) => new Promise((resolve, reject) => {
  const req = http.request({
    host: '127.0.0.1',
    port: server.address().port,
    method,
    path,
    headers,
  }, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => { res.body = data; resolve(res); });
  });
  req.on('error', reject);
  if (body) req.write(body);
  req.end();
});

let server;

test.before(async () => {
  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('rejects oversized bodies, constrained multipart uploads, and excess API requests', async () => {
  pool.query = async () => ({ rows: [] });
  const normal = await request(server, { path: '/api/games' });
  assert.equal(normal.statusCode, 200);
  assert.deepEqual(JSON.parse(normal.body), []);
  // A well-formed file must pass multipart parsing and reach normal game validation.
  const smallBoundary = 'normal-upload';
  const smallBody = `--${smallBoundary}\r\nContent-Disposition: form-data; name="savefile"; filename="sample.sav"\r\nContent-Type: application/octet-stream\r\n\r\n` + 'x'.repeat(32768) + `\r\n--${smallBoundary}--\r\n`;
  const accepted = await request(server, {
    method: 'POST', path: '/api/savefile/upload/1/1',
    headers: { 'content-type': `multipart/form-data; boundary=${smallBoundary}`, 'content-length': Buffer.byteLength(smallBody) },
    body: smallBody,
  });
  assert.equal(accepted.statusCode, 404);
  assert.deepEqual(JSON.parse(accepted.body), { error: 'Game not found' });

  const oversized = 'x'.repeat(101 * 1024);
  const oversizedResponse = await request(server, {
    method: 'POST',
    path: '/api/health',
    headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(oversized) },
    body: oversized,
  });
  assert.equal(oversizedResponse.statusCode, 413);

  const boundary = 'upload-boundary';
  const multipart = Array.from({ length: 11 }, (_, index) => (
    `--${boundary}\r\nContent-Disposition: form-data; name="field${index}"\r\n\r\nvalue\r\n`
  )).join('') + `--${boundary}--\r\n`;
  const uploadResponse = await request(server, {
    method: 'POST',
    path: '/api/savefile/upload/1/1',
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'content-length': Buffer.byteLength(multipart),
    },
    body: multipart,
  });
  assert.equal(uploadResponse.statusCode, 413);

  for (let index = 0; index < 6; index += 1) {
    const response = await request(server, { path: '/api/health' });
    assert.equal(response.statusCode, 200);
  }
  const limitedResponse = await request(server, { path: '/api/health', headers: { 'x-forwarded-for': '203.0.113.72' } });
  assert.equal(limitedResponse.statusCode, 429);
});


test('production requires an explicitly configured database password', () => {
  const { spawnSync } = require('node:child_process');
  const env = { ...process.env, NODE_ENV: 'production' };
  delete env.DB_PASSWORD;
  const child = spawnSync(process.execPath, ['-e', "require('./server')"], { cwd: require('node:path').join(__dirname, '..'), env, encoding: 'utf8', timeout: 5000 });
  assert.notEqual(child.status, 0);
  assert.match(child.stderr, /Set DB_PASSWORD before starting the production API/);
});
