const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx', 'utf8');

// Fix both occurrences of the semicolon issue
let fixed = content.replace(
  /const \[formData, setFormData\] = useState\(\{\s*title: '',\s*department: '',\s*description: '',\s*skills: \[\] as string\[\],\s*weeklyHours: '20',\s*durationMonths: '3',\s*};/g,
  `const [formData, setFormData] = useState({\n    title: '',\n    department: '',\n    description: '',\n    skills: [] as string[],\n    weeklyHours: '20',\n    durationMonths: '3',\n  },\n);`
);

fs.writeFileSync('C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx', fixed, 'utf8');
console.log('Fixed');