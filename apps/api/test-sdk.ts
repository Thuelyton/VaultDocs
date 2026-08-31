import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { r2Client } from './src/config/r2';
import { PutObjectCommand, ListObjectsCommand } from '@aws-sdk/client-s3';

async function test() {
  console.log('🧪 Testando AWS SDK com FetchHttpHandler...\n');
  
  try {
    // Try to list objects in bucket (simpler than ListBuckets)
    console.log('📡 Listando objetos no bucket...');
    const listCommand = new ListObjectsCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'vaultdocs-storage',
      MaxKeys: 5,
    });
    const listResponse = await r2Client.send(listCommand);
    console.log('✅ ListObjects bem-sucedido!');
    console.log('   Objetos:', listResponse.Contents?.length || 0);
    
  } catch (error: any) {
    console.error('❌ ListObjects Erro:', error.name, '-', error.message?.substring(0, 200));
    
    if (error.name === 'Unauthorized' || error.$metadata?.httpStatusCode === 403) {
      console.error('\n🔑 As credenciais parecem estar incorretas ou sem permissão.');
      console.error('   Verifique no painel do Cloudflare se o token API tem permissão de leitura.');
    }
  }
  
  try {
    // Try to upload a test file
    console.log('\n📤 Testando upload...');
    const testContent = Buffer.from('Teste VaultDocs');
    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'vaultdocs-storage',
      Key: 'test/test.txt',
      Body: testContent,
      ContentType: 'text/plain',
    });
    await r2Client.send(putCommand);
    console.log('✅ Upload bem-sucedido!');
    
  } catch (error: any) {
    console.error('❌ Upload Erro:', error.name, '-', error.message?.substring(0, 200));
    
    if (error.name === 'Unauthorized' || error.$metadata?.httpStatusCode === 403) {
      console.error('\n🔑 As credenciais não têm permissão de escrita.');
      console.error('   Verifique no painel do Cloudflare se o token API tem permissão de escrita.');
    }
  }
}

test();
