const fs = require('fs');
const filePath = 'C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix className expressions missing closing brace before >
// Pattern: className={...expression...)\n                        >
content = content.replace(
  /className=\{([^}]*)\}\)\s*\n\s*>/g,
  'className={$1})}\n                        >'
);
content = content.replace(
  /className=\{([^}]*)\}\)\s*>/g,
  'className={$1})}>'
);

// Also fix any remaining className={...expression... > without closing brace
content = content.replace(
  /className=\{"([^"]*)" \+ \(([^)]*)\)\s*>/g,
  'className={"$1" + ($2)}>'
);

fs.writeFileSync(filePath, content);
console.log('Fixed className braces');