const fs = require('fs');
const filePath = 'C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix all string concatenations in JSX attributes - wrap in { }
content = content.replace(
  /([a-zA-Z-]+)="([^"]*)" \+ ([a-zA-Z0-9_$]+)/g,
  '$1={"$2" + $3}'
);
content = content.replace(
  /([a-zA-Z-]+)="([^"]*)" \+ ([a-zA-Z0-9_$]+)}/g,
  '$1={"$2" + $3}'
);

fs.writeFileSync(filePath, content);
console.log('Fixed all concatenations');