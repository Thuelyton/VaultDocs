
import 'dotenv/config';
import { GeminiProvider } from './services/ai/GeminiProvider';

async function testGemini() {
  console.log('--- Testando Gemini Provider ---');
  
  const provider = new GeminiProvider();
  
  if (!provider.isConfigured()) {
    console.error('ERRO: Gemini Provider não está configurado corretamente. Verifique a GEMINI_API_KEY no .env');
    return;
  }

  console.log('Provider configurado com sucesso!');

  const mockOcrText = `
    CARTEIRA NACIONAL DE HABILITAÇÃO
    NOME: JOÃO SILVA DOS SANTOS
    CPF: 123.456.789-00
    RG: 12.345.678-9 SSP/SP
    DATA DE NASCIMENTO: 15/05/1990
    VALIDADE: 20/12/2028
    CATEGORIA: AB
  `;

  console.log('Enviando texto OCR fictício para extração...');

  try {
    const result = await provider.extractDocumentData(mockOcrText, 'CNH');
    console.log('--- Resultado da Extração ---');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.person?.name?.includes('JOÃO')) {
      console.log('\n✅ TESTE BEM SUCEDIDO: A Gemini extraiu os dados corretamente!');
    } else {
      console.log('\n⚠️ AVISO: A Gemini respondeu, mas o nome esperado não foi encontrado.');
    }
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

testGemini();
