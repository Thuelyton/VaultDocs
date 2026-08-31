/**
 * Test script to validate the upload endpoint.
 *
 * Reproduces three scenarios:
 *   1. Real multipart upload with binary content (what RN should send).
 *   2. RN-style payload where 'file' is a string (the current bug).
 *   3. JSON payload.
 *
 * For each scenario we hit POST /api/v1/upload/document and inspect
 * whether multer parsed the file.
 *
 * Run with: tsx src/test-upload.ts
 */

import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import FormData from 'form-data';
import http from 'http';
import jwt from 'jsonwebtoken';

// Ensure env is loaded from apps/api/.env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: envPath });
}

const HOST = '127.0.0.1';
const PORT = parseInt(process.env.PORT || '3000', 10);

// Create a fake JWT for testing. We need a valid token signed with the
// same JWT_SECRET the API uses, otherwise the authenticate middleware
// will reject the request before we reach multer.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET not set in env. Aborting.');
  process.exit(1);
}

const token = jwt.sign(
  {
    userId: '6a8e1a3c6e4118f4f9cc9668',
    email: 'test@vaultdocs.local',
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log(`🔑 Test JWT issued (1h)`);

interface TestResult {
  name: string;
  status: number;
  body: any;
  contentType?: string;
  contentLength?: number;
}

/**
 * Helper: send a request and capture status + parsed body.
 */
function sendRequest(opts: {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: Buffer | string;
  rawStream?: NodeJS.ReadableStream;
}): Promise<TestResult> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: HOST,
        port: PORT,
        method: opts.method,
        path: opts.path,
        headers: opts.headers || {},
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let body: any = text;
          try {
            body = JSON.parse(text);
          } catch {
            // keep as text
          }
          resolve({
            name: '',
            status: res.statusCode || 0,
            body,
            contentType: res.headers['content-type'] as string | undefined,
            contentLength: res.headers['content-length']
              ? parseInt(res.headers['content-length'] as string, 10)
              : undefined,
          });
        });
      }
    );
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    if (opts.rawStream) opts.rawStream.pipe(req);
    req.end();
  });
}

/**
 * Build a multipart body manually so we can inject a string for 'file'
 * (simulating the RN bug). Returns Buffer + Content-Type header.
 */
function buildMultipartWithStringFile(opts: {
  boundary: string;
  fileValue: string;
}): { body: Buffer; contentType: string; contentLength: number } {
  const b = `--${opts.boundary}`;
  const nl = '\r\n';
  const parts: Buffer[] = [];

  parts.push(Buffer.from(`${b}${nl}Content-Disposition: form-data; name="title"${nl}${nl}licenciamento${nl}`));
  parts.push(Buffer.from(`${b}${nl}Content-Disposition: form-data; name="category"${nl}${nl}outros${nl}`));
  parts.push(
    Buffer.from(
      `${b}${nl}Content-Disposition: form-data; name="expirationDate"${nl}${nl}2026-09-26T00:00:00.000Z${nl}`
    )
  );
  parts.push(
    Buffer.from(
      `${b}${nl}Content-Disposition: form-data; name="file"${nl}${nl}${opts.fileValue}${nl}`
    )
  );
  parts.push(Buffer.from(`${b}--${nl}`));

  const body = Buffer.concat(parts);
  return {
    body,
    contentType: `multipart/form-data; boundary=${opts.boundary}`,
    contentLength: body.length,
  };
}

/**
 * Build a JSON payload simulating what an Express body parser would
 * produce if Content-Type wasn't multipart.
 */
function buildJsonPayload(): { body: Buffer; contentType: string; contentLength: number } {
  const body = Buffer.from(
    JSON.stringify({
      file: '[object Object]',
      title: 'licenciamento',
      category: 'outros',
      expirationDate: '2026-09-26T00:00:00.000Z',
    })
  );
  return {
    body,
    contentType: 'application/json',
    contentLength: body.length,
  };
}

async function main() {
  console.log(`\n🧪 Upload endpoint test against http://${HOST}:${PORT}\n`);

  // Wait briefly for the server to be up
  await new Promise((r) => setTimeout(r, 500));

  // ---------- TEST 1: Real binary multipart (the happy path) ----------
  console.log('─── TEST 1: Real binary multipart/form-data (happy path) ───');
  {
    const fakePdf = Buffer.from('%PDF-1.4\n%fake binary content for testing\n%%EOF\n');
    const fd = new FormData();
    fd.append('file', fakePdf, { filename: 'test.pdf', contentType: 'application/pdf' });
    fd.append('title', 'licenciamento');
    fd.append('category', 'outros');
    fd.append('expirationDate', '2026-09-26T00:00:00.000Z');

    const headers = {
      ...fd.getHeaders(),
      Authorization: `Bearer ${token}`,
      'Content-Length': String(fd.getLengthSync()),
    };

    const result = await sendRequest({
      method: 'POST',
      path: '/api/v1/upload/document',
      headers,
      rawStream: fd as unknown as NodeJS.ReadableStream,
    });
    console.log('status:', result.status);
    console.log('body:', JSON.stringify(result.body, null, 2));
    const ok = result.status === 201 && result.body?.data?.document;
    console.log(ok ? '✅ PASS: document created\n' : '❌ FAIL\n');
  }

  // ---------- TEST 2: RN bug — file as a string inside multipart ----------
  console.log('─── TEST 2: RN bug — file sent as "[object Object]" string ───');
  {
    const boundary = '----WebKitFormBoundarye1metD6Lq8TG0V06';
    const built = buildMultipartWithStringFile({
      boundary,
      fileValue: '[object Object]',
    });
    console.log(`Content-Length: ${built.contentLength} bytes`);

    const result = await sendRequest({
      method: 'POST',
      path: '/api/v1/upload/document',
      headers: {
        'Content-Type': built.contentType,
        'Content-Length': String(built.contentLength),
        Authorization: `Bearer ${token}`,
      },
      body: built.body,
    });
    console.log('status:', result.status);
    console.log('body:', JSON.stringify(result.body, null, 2));
    console.log('   (Expected: multer parses it but req.file is undefined,')
    console.log('    req.body.file is the string "[object Object]")\n');
  }

  // ---------- TEST 3: application/json payload ----------
  console.log('─── TEST 3: application/json (worst case) ───');
  {
    const built = buildJsonPayload();
    const result = await sendRequest({
      method: 'POST',
      path: '/api/v1/upload/document',
      headers: {
        'Content-Type': built.contentType,
        'Content-Length': String(built.contentLength),
        Authorization: `Bearer ${token}`,
      },
      body: built.body,
    });
    console.log('status:', result.status);
    console.log('body:', JSON.stringify(result.body, null, 2));
    console.log('\n');
  }
}

main().catch((err) => {
  console.error('❌ Test runner error:', err);
  process.exit(1);
});
