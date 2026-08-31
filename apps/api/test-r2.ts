import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { r2Client, R2_CONFIG } from './src/config/r2';
import { ListBucketsCommand } from '@aws-sdk/client-s3';

async function testR2Connection() {
  console.log('🔍 Testando conexão com Cloudflare R2...\n');
  
  // Verificar variáveis de ambiente
  console.log('📋 Configuração:');
  console.log(`   Account ID: ${process.env.R2_ACCOUNT_ID ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`   Access Key: ${process.env.R2_ACCESS_KEY_ID ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`   Secret Key: ${process.env.R2_SECRET_ACCESS_KEY ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`   Bucket: ${R2_CONFIG.bucketName}`);
  console.log('');

  try {
    // Tentar listar buckets (teste de conexão)
    console.log('📡 Conectando ao R2...');
    const command = new ListBucketsCommand({});
    const response = await r2Client.send(command);
    
    console.log('✅ Conexão bem-sucedida!\n');
    
    if (response.Buckets && response.Buckets.length > 0) {
      console.log('📦 Buckets encontrados:');
      response.Buckets.forEach(bucket => {
        console.log(`   - ${bucket.Name}`);
      });
    } else {
      console.log('⚠️ Nenhum bucket encontrado (pode ser normal se ainda não criou)');
    }
    
    console.log('\n🎉 R2 está funcionando corretamente!');
    console.log('💡 Agora você pode fazer upload de documentos no VaultDocs.');
    
  } catch (error: any) {
    console.error('❌ Erro ao conectar com R2:');
    console.error(`   ${error.message}`);
    
    if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
      console.error('\n🔑 Possíveis causas:');
      console.error('   - Access Key ID incorreto');
      console.error('   - Secret Access Key incorreto');
      console.error('   - Token de API expirado ou revogado');
    } else if (error.name === 'NoSuchBucket') {
      console.error('\n📦 Bucket não encontrado:');
      console.error(`   - Verifique se o bucket "${R2_CONFIG.bucketName}" existe`);
    } else {
      console.error('\n🔧 Verifique:');
      console.error('   - Se as credenciais estão corretas no .env');
      console.error('   - Se você tem conexão com a internet');
      console.error('   - Se a conta Cloudflare está ativa');
    }
  }
}

testR2Connection();
