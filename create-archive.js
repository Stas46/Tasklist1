const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

// Создаем поток записи
const output = fs.createWriteStream('tasklist-enhanced.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // максимальное сжатие
});

// Обработчики событий
output.on('close', function() {
  console.log('Архив создан успешно!');
  console.log('Размер архива: ' + archive.pointer() + ' байт');
  console.log('Файл: tasklist-enhanced.zip');
});

archive.on('error', function(err) {
  console.error('Ошибка создания архива:', err);
  throw err;
});

// Подключаем поток
archive.pipe(output);

// Добавляем всю папку tasklist в архив
archive.directory('tasklist/', 'tasklist/');

// Завершаем архивирование
archive.finalize();