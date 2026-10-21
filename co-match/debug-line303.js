const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx', 'utf8');
const lines = content.split('\n');
console.log('Line 303 chars:', JSON.stringify(lines[302]));
console.log('Line 303 length:', lines[302].length);
for (let j = 0; j < lines[302].length; j++) {
  console.log(j, lines[302][j], lines[302].charCodeAt(j));
}