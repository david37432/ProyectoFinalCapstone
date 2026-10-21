const fs = require('fs');
const filePath = 'C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace form content with minimal form
const formStart = content.indexOf('<form onSubmit={handleSubmit}');
const formEnd = content.indexOf('</form>', formStart) + 7;
const newForm = '<form onSubmit={handleSubmit} className="space-y-6">\n  <div>Test</div>\n</form>';
const newContent = content.substring(0, formStart) + newForm + content.substring(formEnd);
fs.writeFileSync(filePath, newContent);
console.log('Replaced form with minimal');