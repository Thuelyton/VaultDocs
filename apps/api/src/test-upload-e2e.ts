/**
 * End-to-end test that simulates exactly what expo-file-system.uploadAsync
 * with uploadType: MULTIPART sends to the API.
 *
 * We send a real PNG buffer as the 'file' field, plus the form parameters
 * the UploadScreen passes (title, category, expirationDate).
 *
 * Run with: npx tsx --require ./preload.cjs src/test-upload-e2e.ts
 */

import path from 'path';
import fs from 'fs';
import FormData from 'form-data';
import http from 'http';
import jwt from 'jsonwebtoken';

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  // dotenv already loaded via preload, but ensure .env values are present
}

const HOST = '127.0.0.1';
const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET!;

const token = jwt.sign(
  { userId: '6a8e1a3c6e4118f4f9cc9668', email: 'test@vaultdocs.local' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

function postMultipart(
  urlPath: string,
  form: FormData,
  authToken: string
): Promise<{ status: number; body: any; contentLength?: number }> {
  return new Promise((resolve, reject) => {
    const headers = {
      ...form.getHeaders(),
      Authorization: `Bearer ${authToken}`,
      'Content-Length': String(form.getLengthSync()),
    };

    const req = http.request(
      { host: HOST, port: PORT, method: 'POST', path: urlPath, headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let body: any = text;
          try { body = JSON.parse(text); } catch {}
          resolve({
            status: res.statusCode || 0,
            body,
            contentLength: parseInt((res.headers['content-length'] as string) || '0', 10),
          });
        });
      }
    );
    req.on('error', reject);
    form.pipe(req);
  });
}

async function main() {
  console.log('\n🧪 E2E Upload Test — simulating expo-file-system.uploadAsync\n');

  // Realistic PNG (1x1 red pixel) — ~70 bytes of actual binary
  const pngBuffer = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108020000009077' +
    '53de0000000c4944415478da63f8cfc000000003000111021c4d4034000000' +
    '0049454e44ae426082',
    'hex'
  );

  const fd = new FormData();
  fd.append('file', pngBuffer, { filename: 'test-image.png', contentType: 'image/png' });
  fd.append('title', 'CNH - Teste E2E');
  fd.append('category', 'documentos_pessoais');
  fd.append('expirationDate', '2027-01-15T00:00:00.000Z');

  const result = await postMultipart('/api/v1/upload/document', fd, token);

  console.log('HTTP Status:', result.status);
  console.log('Response Body:', JSON.stringify(result.body, null, 2));

  if (result.status === 201 && result.body?.data?.document?._id) {
    console.log('\n✅ E2E UPLOAD WORKS');
    console.log('   document._id:', result.body.data.document._id);
    console.log('   storageKey:', result.body.data.document.file?.storageKey);
    console.log('   sizeBytes:', result.body.data.document.file?.sizeBytes);
    console.log('   publicUrl:', result.body.data.file?.publicUrl);
    console.log('   status:', result.body.data.document.status);
    console.log('   processing:', result.body.data.document.processing);
  } else {
    console.log('\n❌ E2E UPLOAD FAILED');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
