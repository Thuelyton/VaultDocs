import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import crypto from 'crypto';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'vaultdocs-storage';

async function testR2WithFetch() {
  console.log('🔍 Testando conexão com Cloudflare R2 usando Fetch...\n');
  
  console.log('📋 Configuração:');
  console.log(`   Account ID: ${R2_ACCOUNT_ID ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`   Access Key: ${R2_ACCESS_KEY_ID ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`   Secret Key: ${R2_SECRET_ACCESS_KEY ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`   Bucket: ${R2_BUCKET_NAME}`);
  console.log('');

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error('❌ Credenciais não configuradas!');
    return;
  }

  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  
  try {
    console.log('📡 Conectando ao R2...');
    console.log(`   Endpoint: ${endpoint}`);
    
    // Simple test - just try to access the endpoint
    const response = await fetch(`${endpoint}/`, {
      method: 'GET',
      headers: {
        'Host': `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      },
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);
    
    if (response.status === 403) {
      console.log('✅ Conexão estabelecida! (403 = Access Denied, mas conexão funciona)');
      console.log('\n🎉 R2 está acessível!');
      console.log('💡 As credenciais estão configuradas. Teste o upload no app.');
    } else if (response.status === 400) {
      console.log('✅ Conexão estabelecida! (400 = Bad Request, mas conexão funciona)');
      console.log('\n🎉 R2 está acessível!');
    } else {
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}`);
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao conectar com R2:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('fetch failed')) {
      console.error('\n🌐 Possíveis causas:');
      console.error('   - Sem conexão com a internet');
      console.error('   - Firewall bloqueando a conexão');
      console.error('   - Proxy configurado incorretamente');
    }
  }
}

testR2WithFetch();
