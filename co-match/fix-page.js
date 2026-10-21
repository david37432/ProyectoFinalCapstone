const fs = require('fs');
const filePath = 'C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix first occurrence - filteredSkills.map
content = content.replace(
  /filteredSkills\.map\(skill => \([\s\S]*?\)\}\)/,
  'filteredSkills.map((skill) => { return ( <button key={skill} type="button" onClick={() => { setNewSkill(skill); handleSkillToggle(skill); }} className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100" > {skill} </button> ); })'
);

// Fix second occurrence - the IIFE pattern for selected skills
content = content.replace(
  /\{\(\(\) => \{[\s\S]*?\}\)\}/,
  '{(() => { if (formData.skills.length === 0) { return ( <p className="text-sm text-neutral-500 w-full">Añade tus habilidades técnicas y tecnologías</p> ); } const skillsList = formData.skills.map((skill, i) => ( <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"> {skill} <button type="button" onClick={() => handleSkillToggle(skill)} className="p-0.5 hover:bg-primary/20 rounded-full" aria-label={"Eliminar " + skill} > <X className="w-3.5 h-3.5" /> </button> </span> )); return ( <div> {formData.skills.map((skill, i) => ( <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"> {skill} <button type="button" onClick={() => handleSkillToggle(skill)} className="p-0.5 hover:bg-primary/20 rounded-full" aria-label={"Eliminar " + skill} > <X className="w-3.5 h-3.5" /> </button> </span> )); )} </div> ); })}'
);

fs.writeFileSync(filePath, content);
console.log('Fixed both occurrences');