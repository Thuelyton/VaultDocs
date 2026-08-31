#!/usr/bin/env node
/**
 * End-to-end smoke test for VaultDocs API.
 * Validates: register, login, auth, upload, list, presigned URL, delete.
 * No secrets printed. Exits non-zero on failure.
 */
const http = require('http');
const https = require('https');
const crypto = require('crypto');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const PASSWORD = 'E2ETestPass123!';

function req(method, p, { headers = {}, body, formData } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(p, BASE);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers: { ...headers },
      protocol: url.protocol,
    };
    let payload;
    if (formData) {
      const boundary = '----e2e' + crypto.randomBytes(8).toString('hex');
      opts.headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
      const parts = [];
      for (const [k, v] of Object.entries(formData.fields || {})) {
        parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
      }
      if (formData.file) {
        const f = formData.file;
        const head = Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${f.field}"; filename="${f.filename}"\r\nContent-Type: ${f.contentType}\r\n\r\n`
        );
        const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
        payload = Buffer.concat([...parts, head, f.content, tail]);
      } else {
        payload = Buffer.concat([...parts, Buffer.from(`--${boundary}--\r\n`)]);
      }
      opts.headers['Content-Length'] = payload.length;
    } else if (body) {
      payload = Buffer.from(JSON.stringify(body));
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = payload.length;
    }
    const lib = opts.protocol === 'https:' ? https : http;
    const r = lib.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(buf); } catch { parsed = buf; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

const ok = (label, cond, extra) => {
  const mark = cond ? '✅' : '❌';
  console.log(`${mark} ${label}${extra ? ' — ' + extra : ''}`);
  if (!cond) process.exitCode = 1;
};

(async () => {
  const stamp = Date.now();
  const email = `e2e-${stamp}@vaultdocs.test`;
  console.log(`\n=== VaultDocs E2E (base=${BASE}) ===\n`);

  // 1. Health
  const health = await req('GET', '/health');
  ok('GET /health', health.status === 200 && health.body.status === 'ok', `uptime=${health.body.uptime?.toFixed?.(1)}s`);

  // 2. Register
  const reg = await req('POST', '/api/v1/auth/register', {
    body: { name: 'E2E Test', email, password: PASSWORD },
  });
  ok('POST /auth/register', reg.status === 201 && !!reg.body.data?.token, `userId=${reg.body.data?.user?._id?.slice(-6)}`);
  const token = reg.body.data?.token;
  if (!token) return;

  const auth = { Authorization: `Bearer ${token}` };

  // 3. Login (verify password works for re-login)
  const login = await req('POST', '/api/v1/auth/login', { body: { email, password: PASSWORD } });
  ok('POST /auth/login', login.status === 200 && !!login.body.data?.token, 'token issued');

  // 4. Authenticated /auth/me
  const me = await req('GET', '/api/v1/auth/me', { headers: auth });
  ok('GET /auth/me', me.status === 200 && me.body.data?.email === email);

  // 5. Upload file + create document
  const pngBytes = Buffer.from(
    '89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D49444154789C636060000000000500017A6D5C7B0000000049454E44AE426082',
    'hex'
  );
  const upload = await req('POST', '/api/v1/upload/document', {
    headers: auth,
    formData: {
      fields: { title: 'E2E Document', category: 'outros' },
      file: { field: 'file', filename: 'e2e-test.png', contentType: 'image/png', content: pngBytes },
    },
  });
  ok(
    'POST /upload/document',
    upload.status === 201 && !!upload.body.data?.document?._id,
    `storageKey=${upload.body.data?.document?.file?.storageKey?.slice(0, 50)}…`
  );
  const docId = upload.body.data?.document?._id;
  const storageKey = upload.body.data?.document?.file?.storageKey;
  if (!docId) return;

  // 6. List documents (NOTE: list spreads {documents, pagination} at top level)
  const list = await req('GET', '/api/v1/documents?limit=5', { headers: auth });
  ok('GET /documents', list.status === 200 && Array.isArray(list.body.documents), `count=${list.body.documents?.length}`);

  // 7. Presigned view-url
  const view = await req('GET', `/api/v1/documents/${docId}/view-url`, { headers: auth });
  ok('GET /documents/:id/view-url', view.status === 200 && view.body.data?.viewUrl?.startsWith('https://'), `expires=${view.body.data?.viewUrl?.includes('X-Amz-Expires=900') ? '15min' : '?'}`);

  // 8. Verify presigned URL actually downloads the file (BEFORE deleting)
  const viewUrl = view.body.data.viewUrl;
  const dl = await req('GET', viewUrl);
  ok('Presigned URL downloads file', dl.status === 200, `HTTP ${dl.status}`);

  // 9. Delete document (cascades to R2)
  const del = await req('DELETE', `/api/v1/documents/${docId}`, { headers: auth });
  ok('DELETE /documents/:id', del.status === 204);

  // 10. Confirm document is gone
  const after = await req('GET', `/api/v1/documents/${docId}`, { headers: auth });
  ok('Document no longer found', after.status === 404);

  // 11. Confirm R2 object deleted
  const dlAfter = await req('GET', viewUrl);
  ok('R2 object deleted', dlAfter.status === 404, `HTTP ${dlAfter.status}`);

  console.log('\n=== DONE ===');
})().catch((e) => {
  console.error('FATAL:', e);
  process.exit(2);
});
