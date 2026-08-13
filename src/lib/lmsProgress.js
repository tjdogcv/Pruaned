export function normalizeAudience(value) {
  const audience = Array.isArray(value) ? value : ['socios', 'voluntarios'];
  const validAudience = audience.filter((item) => item === 'socios' || item === 'voluntarios');
  return validAudience.length ? validAudience : ['socios', 'voluntarios'];
}

export function attachCourseModules(courses = [], modules = []) {
  const modulesByCourse = modules.reduce((index, module) => {
    if (!index[module.courseId]) index[module.courseId] = [];
    index[module.courseId].push(module);
    return index;
  }, {});

  return courses.map((course) => ({
    ...course,
    audience: normalizeAudience(course.audience),
    modules: (modulesByCourse[course.id]?.length
      ? modulesByCourse[course.id]
      : (course.modules || []).map((module, index) => ({
        id: typeof module === 'object' && module.id ? module.id : `${course.id}-module-${index}`,
        courseId: course.id,
        title: typeof module === 'string' ? module : module.title,
        content: typeof module === 'string' ? null : module.content || null,
        position: typeof module === 'object' && Number.isFinite(module.position) ? module.position : index
      }))
    ).sort((first, second) => first.position - second.position)
  }));
}

export function courseProgress(course, moduleProgress = [], result) {
  const modules = course.modules || [];
  const completedModuleIds = new Set(moduleProgress.map((progress) => progress.moduleId));
  const completedModules = modules.filter((module) => completedModuleIds.has(module.id)).length;
  const totalModules = modules.length;
  const percentage = totalModules ? Math.round((completedModules / totalModules) * 100) : 0;

  return {
    completedModules,
    totalModules,
    percentage,
    status: result?.status || (completedModules ? 'en_progreso' : 'sin_iniciar'),
    score: result?.score ?? null,
    attempts: result?.attempts || 0,
    completedAt: result?.completedAt || null
  };
}

export function resultForCourse(results = [], courseId) {
  return results.find((result) => result.courseId === courseId) || null;
}

export function assessmentLabel(course) {
  return course.hasEvaluation ? 'Incluida' : 'Sin evaluación';
}
