const fs = require('fs');
const sharp = require('sharp');

const input = process.env.ICON || 'assets/icon.png';
if (!fs.existsSync(input)) {
  console.error('Не найден файл иконки: ' + input);
  process.exit(1);
}

fs.mkdirSync('web/icons', { recursive: true });

async function make(size, out){
  await sharp(input).resize(size, size, { fit: 'cover', background: '#ffffff' }).png().toFile(out);
  console.log('✓ ' + out);
}

(async () => {
  await make(192, 'web/icons/icon-192.png');
  await make(512, 'web/icons/icon-512.png');
  await make(512, 'web/icons/maskable-512.png');
  await make(32,  'web/icons/favicon-32.png');
  await make(16,  'web/icons/favicon-16.png');
})();

