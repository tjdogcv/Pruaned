import assert from 'node:assert/strict';
import test from 'node:test';
import {
  attachCourseModules,
  courseProgress,
  getCourseVideoEmbedUrl,
  normalizeAudience,
  resultForCourse
} from '../src/lib/lmsProgress.js';

test('normaliza audiencia sin ampliar el acceso a valores inválidos', () => {
  assert.deepEqual(normalizeAudience(['socios', 'externos']), ['socios']);
  assert.deepEqual(normalizeAudience(['externos']), ['socios', 'voluntarios']);
});

test('prefiere módulos persistidos y conserva el material de demostración offline', () => {
  const [onlineCourse] = attachCourseModules([{ id: 'course-1', modules: ['Material local'] }], [
    { id: 'module-2', courseId: 'course-1', title: 'Segundo', videoUrl: 'https://youtu.be/abc123', position: 2 },
    { id: 'module-1', courseId: 'course-1', title: 'Primero', position: 1 }
  ]);
  assert.deepEqual(onlineCourse.modules.map((module) => module.id), ['module-1', 'module-2']);
  assert.equal(onlineCourse.modules[1].videoUrl, 'https://youtu.be/abc123');

  const [offlineCourse] = attachCourseModules([{ id: 'course-2', modules: ['Uno'] }], []);
  assert.equal(offlineCourse.modules[0].id, 'course-2-module-0');
  assert.equal(offlineCourse.modules[0].title, 'Uno');
});

test('calcula el avance sólo desde módulos completados y el resultado del curso', () => {
  const course = {
    modules: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }]
  };
  const progress = courseProgress(course, [{ moduleId: 'm1' }, { moduleId: 'unrelated' }], {
    status: 'reprobado', score: 60, attempts: 2
  });
  assert.equal(progress.completedModules, 1);
  assert.equal(progress.percentage, 33);
  assert.equal(progress.status, 'reprobado');
  assert.equal(progress.score, 60);
  assert.equal(resultForCourse([{ courseId: 'course-1', status: 'aprobado' }], 'course-1').status, 'aprobado');
});

test('sólo crea embeds para fuentes de video aprobadas', () => {
  assert.equal(getCourseVideoEmbedUrl('https://youtu.be/abc123'), 'https://www.youtube-nocookie.com/embed/abc123');
  assert.equal(getCourseVideoEmbedUrl('https://www.youtube.com/watch?v=abc123'), 'https://www.youtube-nocookie.com/embed/abc123');
  assert.equal(getCourseVideoEmbedUrl('https://drive.google.com/file/d/abc123/view'), 'https://drive.google.com/file/d/abc123/preview');
  assert.equal(getCourseVideoEmbedUrl('https://example.org/video'), null);
});
