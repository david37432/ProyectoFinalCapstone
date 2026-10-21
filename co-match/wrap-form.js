const fs = require('fs');
const filePath = 'C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Wrap form content in a single div
const formStart = content.indexOf('<form onSubmit={handleSubmit}');
const formEnd = content.indexOf('</form>', formStart) + 7;

// Find the content inside the form (after the opening > of form tag)
const formTagEnd = content.indexOf('>', formStart) + 1;
const formCloseTagStart = content.lastIndexOf('</form>', formEnd);

const beforeForm = content.substring(0, formTagEnd);
const formInner = content.substring(formTagEnd, formCloseTagStart);
const afterForm = content.substring(formCloseTagStart);

// Wrap inner content in a div
const newContent = beforeForm + '\n                <div className="form-wrapper">' + formInner + '\n                </div>' + afterForm;

fs.writeFileSync(filePath, newContent);
console.log('Wrapped form content in div');