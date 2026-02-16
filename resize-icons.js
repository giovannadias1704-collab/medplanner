import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resizeIcons() {
  // ⬇️ USANDO BARRAS NORMAIS (/) que funcionam no Windows também
  const inputFile = 'C:/Users/giova/OneDrive/Área de Trabalho/Editedimage_1771257883215.png';
  const publicDir = path.join(__dirname, 'public');

  console.log('🔍 Procurando arquivo em:', inputFile);

  try {
    // Criar icon-512.png
    await sharp(inputFile)
      .resize(512, 512, { fit: 'cover' })
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    
    console.log('✅ icon-512.png criado com sucesso!');

    // Criar icon-192.png
    await sharp(inputFile)
      .resize(192, 192, { fit: 'cover' })
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    
    console.log('✅ icon-192.png criado com sucesso!');
    console.log('🎉 Ícones criados na pasta public/');
    console.log('');
    console.log('📂 Arquivos criados:');
    console.log('   - public/icon-512.png');
    console.log('   - public/icon-192.png');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('');
    console.log('💡 Verifique se o arquivo existe em:');
    console.log('   C:/Users/giova/OneDrive/Área de Trabalho/Editedimage_1771257883215.png');
  }
}

resizeIcons();