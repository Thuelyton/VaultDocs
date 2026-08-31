import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { r2Service } from './src/services/R2Service';

async function testUpload() {
  console.log('🔍 Testando upload para Cloudflare R2...\n');
  
  // Create a test file
  const testContent = Buffer.from('Este é um arquivo de teste do VaultDocs!');
  const testFile = {
    buffer: testContent,
    originalname: 'test.txt',
    mimetype: 'text/plain',
    size: testContent.length,
  };

  try {
    console.log('📤 Fazendo upload do arquivo de teste...');
    const result = await r2Service.uploadFile(testFile);
    
    console.log('✅ Upload realizado com sucesso!\n');
    console.log('📁 Resultado:');
    console.log(`   Storage Key: ${result.storageKey}`);
    console.log(`   Original Name: ${result.originalName}`);
    console.log(`   MIME Type: ${result.mimeType}`);
    console.log(`   Size: ${result.sizeBytes} bytes`);
    console.log(`   Public URL: ${result.publicUrl}`);
    
    console.log('\n🎉 R2 está funcionando corretamente!');
    console.log('💡 Agora você pode fazer upload de documentos no VaultDocs.');
    
  } catch (error: any) {
    console.error('❌ Erro no upload:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('403')) {
      console.error('\n🔑 Possíveis causas:');
      console.error('   - Credenciais incorretas');
      console.error('   - Token sem permissão de escrita');
    } else if (error.message.includes('404')) {
      console.error('\n📦 Possíveis causas:');
      console.error('   - Bucket não existe');
      console.error('   - Nome do bucket incorreto');
    }
  }
}

testUpload();
