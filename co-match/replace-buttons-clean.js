const fs = require('fs');
const filePath = 'C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace first Button (Cancel)
content = content.replace(
  /<Button variant="secondary" onClick={() => router\.push\('\/dashboard\/dependencia'\)}>\s*<X className="w-4 h-4 mr-2" \/>\s*Cancelar\s*<\/Button>/g,
  '<button type="button" onClick={() => router.push("/dashboard/dependencia")} className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"><X className="w-4 h-4 mr-2" />Cancelar</button>'
);

// Replace second Button (Submit)
content = content.replace(
  /<Button\s+type="submit"\s+disabled=\{isLoading\}\s+size="lg"\s+className="flex-1">\s*<Save className="w-4 h-4 mr-2" \/>\s*Publicar y buscar candidatos\s*<\/Button>/g,
  '<button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 flex-1"><Save className="w-4 h-4 mr-2" />Publicar y buscar candidatos</button>'
);

// Remove Button import
content = content.replace(/import \{ Button \} from '@\/components\/ui\/Button';\n/, '');

fs.writeFileSync(filePath, content);
console.log('Replaced Buttons with plain buttons');