const fs = require('fs');
const filePath = 'C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix missing } in className expressions - add closing brace before >
content = content.replace(
  /className=\{"([^"]*)" \+ \(([^)]*)\)\s*>/g,
  'className={"$1" + ($2)}>'
);
content = content.replace(
  /className=\{"([^"]*)" \+ \(([^)]*)\)\s*$/gm,
  'className={"$1" + ($2)}'
);

fs.writeFileSync(filePath, content);
console.log('Fixed missing braces');