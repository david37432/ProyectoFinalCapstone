const fs = require('fs');
const filePath = 'C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace template literals in className with string concatenation
// First template literal (department dropdown)
content = content.replace(
  /className=`w-full px-3 py-2 text-left text-sm transition-colors \$\{[\s\S]*?\}`/g,
  'className="w-full px-3 py-2 text-left text-sm transition-colors " + (formData.department === dept ? "bg-primary text-white" : "text-neutral-700 hover:bg-neutral-100")'
);

// Second template literal (weekly hours)
content = content.replace(
  /className=`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all \$\{[\s\S]*?\}`/g,
  'className="px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all " + (formData.weeklyHours === String(hours) ? "bg-primary text-white border-primary" : "bg-white text-neutral-700 border-neutral-300 hover:border-primary/50")'
);

// Third template literal (duration) - same as second but with months
content = content.replace(
  /className=`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all \$\{[\s\S]*?\}`/g,
  'className="px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all " + (formData.durationMonths === String(months) ? "bg-primary text-white border-primary" : "bg-white text-neutral-700 border-neutral-300 hover:border-primary/50")'
);

fs.writeFileSync(filePath, content);
console.log('Replaced template literals');