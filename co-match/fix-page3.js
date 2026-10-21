const fs = require('fs');
const filePath = 'C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix second occurrence - the IIFE pattern for selected skills
const old2 = `{(() => {
                        if (formData.skills.length === 0) {
                          return (
                            <p className="text-sm text-neutral-500 w-full">Añade tus habilidades técnicas y tecnologías</p>
                          );
                        }
                        return (
                          <div>
                            {formData.skills.map((skill, i) => (
                              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                                {skill}
                                <button
                                  type="button"
                                  onClick={() => handleSkillToggle(skill)}
                                  className="p-0.5 hover:bg-primary/20 rounded-full"
                                  aria-label={\`Eliminar \${skill}\`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            );)}
                          </div>
                        )}
                      )}`;

const new2 = `{(() => {
                        if (formData.skills.length === 0) {
                          return (
                            <p className="text-sm text-neutral-500 w-full">Añade tus habilidades técnicas y tecnologías</p>
                          );
                        }
                        const skillsList = formData.skills.map((skill, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleSkillToggle(skill)}
                              className="p-0.5 hover:bg-primary/20 rounded-full"
                              aria-label={"Eliminar " + skill}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ));
                        return (
                          <div>
                            {formData.skills.map((skill, i) => (
                              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                                {skill}
                                <button
                                  type="button"
                                  onClick={() => handleSkillToggle(skill)}
                                  className="p-0.5 hover:bg-primary/20 rounded-full"
                                  aria-label={"Eliminar " + skill}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        );
                      })}`;

if (content.includes(old2)) {
  content = content.replace(old2, new2);
  console.log('Fixed second occurrence');
} else {
  console.log('Second pattern not found - trying alternative');
  // Try with double backticks
  const old2b = `{(() => {\n                        if (formData.skills.length === 0) {\n                          return (\n                            <p className="text-sm text-neutral-500 w-full">Añade tus habilidades técnicas y tecnologías</p>\n                          );\n                        }\n                        return (\n                          <div>\n                            {formData.skills.map((skill, i) => (\n                              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">\n                                {skill}\n                                <button\n                                  type="button"\n                                  onClick={() => handleSkillToggle(skill)}\n                                  className="p-0.5 hover:bg-primary/20 rounded-full"\n                                  aria-label={\`Eliminar \${skill}\`}\n                                >\n                                  <X className="w-3.5 h-3.5" />\n                                </button>\n                              </span>\n                            );)}\n                          </div>\n                        )}\n                      )}`;
  if (content.includes(old2b)) {
    content = content.replace(old2b, new2);
    console.log('Fixed second occurrence (alt)');
  } else {
    console.log('Still not found');
  }
}

fs.writeFileSync(filePath, content);