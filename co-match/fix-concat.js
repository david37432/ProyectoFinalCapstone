const fs = require('fs');
const filePath = 'C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix className string concatenation - need to wrap in { }
content = content.replace(
  /className="([^"]*)" \+ \(/g,
  'className={"$1" + ('
);
content = content.replace(
  /\)" \+ \(/g,
  ') + ('
);

fs.writeFileSync(filePath, content);
console.log('Fixed className concatenation');