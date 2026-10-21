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
                            );
                          )}
                        </div>
                      )}
                        </div>
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
  console.log('Pattern not found exactly, trying to find similar');
  const idx = content.indexOf('{(() => {');
  if (idx !== -1) {
    console.log('Found at index:', idx);
    console.log('Context:', content.substring(idx, idx + 500));
  }
}

fs.writeFileSync(filePath, content);