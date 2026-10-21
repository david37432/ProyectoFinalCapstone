const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx', 'utf8');
const formStart = content.indexOf('<form onSubmit={handleSubmit}');
const formEnd = content.indexOf('</form>', formStart) + 7;
const formContent = content.substring(formStart, formEnd);

// Count all { and } not part of {{ or }}
let openCount = 0;
let closeCount = 0;
for (let i = 0; i < formContent.length; i++) {
  if (formContent[i] === '{' && formContent[i+1] !== '{') openCount++;
  if (formContent[i] === '}' && formContent[i-1] !== '}') closeCount++;
}
console.log('Open braces:', openCount);
console.log('Close braces:', closeCount);
console.log('Difference:', openCount - closeCount);

// Find positions of all braces
console.log('\nAll braces:');
for (let i = 0; i < formContent.length; i++) {
  if (formContent[i] === '{' && formContent[i+1] !== '{') {
    const context = formContent.substring(Math.max(0,i-20), i+20);
    console.log('OPEN at', i, ':', JSON.stringify(context));
  }
  if (formContent[i] === '}' && formContent[i-1] !== '}') {
    const context = formContent.substring(Math.max(0,i-20), i+20);
    console.log('CLOSE at', i, ':', JSON.stringify(context));
  }
}