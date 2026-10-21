const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx', 'utf8');
const lines = content.split('\n');

let braceCount = 0;
for(let i=299; i<305; i++) {
  const line = lines[i];
  console.log('Before line', i+1, 'braceCount=', braceCount);
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{' && line[j+1] !== '{') { braceCount++; console.log('  Open at', j, 'char=', line[j], 'braceCount=', braceCount); }
    if (line[j] === '}' && line[j-1] !== '}') { braceCount--; console.log('  Close at', j, 'char=', line[j], 'braceCount=', braceCount); }
  }
  console.log('After line', i+1, 'braceCount=', braceCount, '|', line.trim());
}