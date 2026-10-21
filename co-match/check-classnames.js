const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx', 'utf8');
const lines = content.split('\n');
for(let i=877; i<1113; i++) {
  const line = lines[i];
  if (line.includes('className=') && line.includes('`')) {
    console.log(i+1 + ': ' + line.trim());
  }
}