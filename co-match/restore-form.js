const fs = require('fs');
const filePath = 'C:\\Users\\Davd Lopez\\Documents\\ProyectoFinalCapstone\\co-match\\src\\app\\dashboard\\dependencia\\publicar\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Restore the clean version I wrote earlier (before minimal form test)
// This is the full form from my earlier write
const fullForm = `<form onSubmit={handleSubmit} className="space-y-6">
                {/* Título de la Necesidad */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Título de la Necesidad <span className="text-danger">*</span>
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ej: Automatización de reportes financieros mensuales"
                    error={errors.title}
                    disabled={isLoading}
                  />
                  {errors.title && <p className="mt-1.5 text-sm text-danger">{errors.title}</p>}
                </div>

                {/* Área / Departamento Solicitante */}
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Área / Departamento Solicitante <span className="text-danger">*</span>
                  </label>
                  <div className="relative" onClick={handleBackdropClick}>
                    <div className="relative">
                      <Input
                        id="department"
                        type="text"
                        value={formData.department}
                        onChange={(e) => {
                          handleInputChange('department', e.target.value);
                          if (e.target.value) setShowDepartmentsDropdown(true);
                        }}
                        onFocus={() => setShowDepartmentsDropdown(true)}
                        placeholder="Selecciona o escribe el área/departamento"
                        readOnly
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
                    </div>
                    {showDepartmentsDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2">
                          <input
                            type="text"
                            value={searchDepartment}
                            onChange={(e) => setSearchDepartment(e.target.value)}
                            placeholder="Buscar departamento..."
                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                          />
                        </div>
                        {filteredDepartments.map((dept) => (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => handleDepartmentSelect(dept)}
                            className="w-full px-3 py-2 text-left text-sm transition-colors " + (formData.department === dept ? "bg-primary text-white" : "text-neutral-700 hover:bg-neutral-100")
                          >
                            {dept}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.department && <p className="mt-1.5 text-sm text-danger">{errors.department}</p>}
                </div>

                {/* Descripción Detallada */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Descripción Detallada del Proceso <span className="text-danger">*</span>
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="1. Proceso actual y problema identificado
2. Tareas específicas a automatizar
3. Impacto esperado en la productividad"
                    rows={6}
                    error={errors.description}
                    disabled={isLoading}
                  />
                  <p className="mt-1.5 text-xs text-neutral-500">
                    Incluye: 1. Proceso actual y problema identificado | 2. Tareas específicas a automatizar | 3. Impacto esperado en la productividad
                  </p>
                  {errors.description && <p className="mt-1.5 text-sm text-danger">{errors.description}</p>}
                </div>

                {/* Habilidades Requeridas */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                      Habilidades Requeridas <span className="text-danger">*</span>
                    </h2>
                    <span className="text-sm text-neutral-500">{selectedSkillsCount} seleccionada{selectedSkillsCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="relative" onClick={handleBackdropClick}>
                    <div className="relative">
                      <Input
                        id="skills-search"
                        type="text"
                        value={searchSkill}
                        onChange={(e) => { setSearchSkill(e.target.value); setShowSkillsDropdown(true); }}
                        onFocus={() => setShowSkillsDropdown(true)}
                        placeholder="Agregar habilidad (ej. Python, Power BI...)"
                        className="w-64 px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                      />
                      {showSkillsDropdown && filteredSkills.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                          {filteredSkills.map((skill) => {
                            return (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => { handleSkillToggle(skill); }}
                                className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                              >
                                {skill}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
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
                              aria-label="Eliminar " + skill
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
                                  aria-label="Eliminar " + skill
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                      {errors.skills && <p className="mt-1.5 text-sm text-danger">{errors.skills}</p>}
                    </div>
                </div>

                {/* Dedicación Semanal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Dedicación Semanal (hrs) <span className="text-danger">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKLY_HOURS_OPTIONS.map((hours) => (
                        <button
                          key={hours}
                          type="button"
                          onClick={() => handleInputChange('weeklyHours', String(hours))}
                          className="px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all " + (formData.weeklyHours === String(hours) ? "bg-primary text-white border-primary" : "bg-white text-neutral-700 border-neutral-300 hover:border-primary/50")
                        >
                          {hours} hrs
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duración del Proyecto */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Duración del Proyecto <span className="text-danger">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DURATION_OPTIONS.map((months) => (
                        <button
                          key={months}
                          type="button"
                          onClick={() => handleInputChange('durationMonths', String(months))}
                          className="px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all " + (formData.durationMonths === String(months) ? "bg-primary text-white border-primary" : "bg-white text-neutral-700 border-neutral-300 hover:border-primary/50")
                        >
                          {months} mes{months !== 1 ? 'es' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-3 pt-4 border-t border-neutral-200">
                  <button type="button" onClick={handleCancel} disabled={isLoading} className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"><X className="w-4 h-4 mr-2" />Cancelar</button>
                  <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 flex-1"><Save className="w-4 h-4 mr-2" />Publicar y buscar candidatos</button>
                </div>
              </form>`;

const formStart = content.indexOf('<form onSubmit={handleSubmit}');
const formEnd = content.indexOf('</form>', formStart) + 7;
const newContent = content.substring(0, formStart) + fullForm + content.substring(formEnd);
fs.writeFileSync(filePath, newContent);
console.log('Restored full form');