-- Contenido inicial opcional para el LMS PRUANED.
-- Ejecutar después de 20260813_lms_operativo.sql.
-- Es idempotente: no duplica cursos, módulos ni preguntas por posición.

with course_upsert as (
  insert into public.cursos_lms (
    code, title, description, hours, duration, audience, status, instructor
  ) values
    (
      'PRU-LMS-001',
      'Inducción institucional PRUANED',
      'Marco institucional, seguridad y principios de actuación en emergencias.',
      4,
      '4 horas',
      array['socios', 'voluntarios']::text[],
      'published',
      'Equipo de formación PRUANED'
    ),
    (
      'PRU-LMS-002',
      'Estatutos, derechos y deberes gremiales',
      'Material exclusivo para socios sobre participación, deberes y marco gremial.',
      3,
      '3 horas',
      array['socios']::text[],
      'published',
      'Directiva Nacional PRUANED'
    )
  on conflict (code) do update set updated_at = now()
  returning id, code
)
insert into public.lms_course_modules (course_id, title, content, position)
select course.id, module.title, module.content, module.position
from course_upsert course
join (
  values
    ('PRU-LMS-001', 1, 'Visión institucional y enfoque One Health', 'Propósito, principios y marco de acción de PRUANED.'),
    ('PRU-LMS-001', 2, 'Seguridad y autocuidado en terreno', 'Protocolos básicos antes, durante y después de una emergencia.'),
    ('PRU-LMS-002', 1, 'Derechos, deberes y participación', 'Participación gremial responsable y mecanismos institucionales.'),
    ('PRU-LMS-002', 2, 'Ética y resguardo de información', 'Estándares de conducta, confidencialidad y trato respetuoso.')
) as module(code, position, title, content) on module.code = course.code
on conflict (course_id, position) do nothing;

insert into public.lms_evaluation_questions (course_id, prompt, options, correct_option, position)
select course.id, question.prompt, question.options, question.correct_option, question.position
from public.cursos_lms course
join (
  values
    (
      'PRU-LMS-002',
      1,
      '¿Cuál es el propósito de una participación gremial responsable?',
      jsonb_build_array('Respetar estatutos, acuerdos y canales institucionales', 'Evitar toda coordinación con la asociación', 'Usar datos de socios sin autorización'),
      0
    ),
    (
      'PRU-LMS-002',
      2,
      '¿Cómo debe tratarse la información personal de socios y voluntarios?',
      jsonb_build_array('Con confidencialidad y sólo para fines autorizados', 'Compartirse libremente en cualquier canal', 'Publicarse para facilitar el contacto'),
      0
    )
) as question(code, position, prompt, options, correct_option) on question.code = course.code
on conflict (course_id, position) do nothing;
