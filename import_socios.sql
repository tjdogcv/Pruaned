-- =========================================================================
-- PRUANED A.G. - Importación de Socios Existentes (Base de Datos CSV)
-- =========================================================================

-- Inserción directa en la tabla socios
INSERT INTO public.socios (rut, nombre, profesion, email, region, categoria, estado_cuota, monto_cuota_mensual, voto)
VALUES 
('17022657-7', 'Agustín Cartes Espinoza', 'Medico Veterinario', 'agustin.cartes@unab.cl', 'Valparaíso', 'Socio Activo', 'Al D�a', 5000, true),
('14345582-6', 'Alejandra Andrea Latorre Soto', 'Medico Veterinario', 'alatorre@udec.cl', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('15436713-6', 'Alejandro Esteban González Ortega', 'Médico Veterinario', 'mv.agonzalez@gmail.com', 'Metropolitana', 'Socio Activo', 'Al D�a', 5000, true),
('17693867-6', 'Alex Sebastian Luis Cortez Pacheco', 'Geógrafo', 'alexslcortezp@hotmail.com', 'Los Ríos', 'Socio Activo', 'Al D�a', 5000, true),
('18014655-5', 'Alexander Kennett Vergara Fuentes', 'Tecnico superior en prevencion de riesgos', 'alekenneth@gmail.com', 'Metropolitana', 'Socio Activo', 'Al D�a', 5000, true),
('16124967-k', 'Alfredo Danilo Barrera Galleguillos', 'tecnico superior agricola', 'nobitein@gmail.com', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('24974381-K', 'Andrea Lorena Portillo García', 'Médico Veterinaria', 'dra.portillousac@gmail', 'Los Ríos', 'Socio Activo', 'Al D�a', 5000, true),
('16768442-4', 'Andrea María José Burgos Betancur', 'Médico veterinario', 'andy.burgos.vet@gmail.com', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('17922086-5', 'Bárbara del Pilar Castillo Barra', 'Abogada', 'barbara.castillobarra@gmail.com', 'Metropolitana', 'Socio Activo', 'Al D�a', 5000, true),
('19334768-1', 'Bastián Jacob León Solar', 'Ingeniero Civil Geólogo', 'bastian.leon.solar@gmail.com', 'Bio Bio', 'Socio Activo', 'Al D�a', 5000, true),
('18155674-9', 'Beatriz Andrea Bórquez Le-fort', 'Medico veterinaria', 'beatriz.borquezl@gmail.com', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('20076793-4', 'Camila Paz Navarrete Valladares', 'Psicóloga', 'c.navarretevalladares@gmail.com', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('16154741-1', 'Carla Rosalia Timmermann Valdebenito', 'Médico veterinario', 'c.timmermann.v@gmail.com', 'Bio Bio', 'Socio Activo', 'Al D�a', 5000, true),
('15877089-k', 'Carol Lisette Lagos Cabezas', 'Médica Veterinaria', 'agroveterinariadelmonte@gmail.com', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('14103905-9', 'Carolina Dulkamara Ortiz Peña', 'Médico Veterinario', 'carolinadulkamara40@gmail.com', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('16992015-k', 'César Adolfo Herrera Rojas', 'Médico Veterinario', 'mv.cesarherrera@gmail.com', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('16538486-5', 'César Vianco Rodríguez Muñoz', 'Médico Veterinario', 'cesar.rodriguez.mv@gmail.com', 'Los Lagos', 'Socio Activo', 'Al D�a', 5000, true),
('18068016-0', 'Constanza Montiel Zuñiga', 'Trabajadora social', 'cemontiel@tsocial.ucsc.cl', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('17810175-7', 'Consuelo Fernanda Blu Salcedo', 'Medico Veterinaria', 'cblu21@gmail.com', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('18768335-1', 'Cristóbal Alejandro Viveros Andrade', 'Licenciado en ciencias veterinarias', 'viveros.andrade.cristobal@gmail.com', 'Bio Bio', 'Socio Activo', 'Al D�a', 5000, true),
('17709255-k', 'Cynthia Catalina Loncomilla Currin', 'Técnico en parvulo', 'cata.loncomilla@gmail.com', 'Metropolitana', 'Socio Activo', 'Al D�a', 5000, true),
('17889260-6', 'Daniela Carolina Alvarado Silva', 'Médico Veterinario', 'danielacarolinaas@gmail.com', 'Los Lagos', 'Socio Activo', 'Al D�a', 5000, true),
('14062444-6', 'Daniela Lucía Figueroa Mora', 'Medico veterinaria', 'daniela.figueroa.mora@gmail.com', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('13435630-8', 'Fabián Retty Espínola Quilodrán', 'Médico Veterinario', 'proyectosocialveterinario@gmail.com', 'Los Lagos', 'Socio Activo', 'Al D�a', 5000, true),
('10437613-4', 'Florence Inés Hugues Salazar', 'Médico Veterinario', 'flohugues@udec.cl', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('14566481-0', 'Gilda Grandón Alvial', 'Ingeniera Forestal', 'gildagrandon@gmail.com', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('15519828-1', 'Jacqueline María Zavala Osorio', 'Médico veterinario', 'jqlinezo@gmail.com', 'Bio Bio', 'Socio Activo', 'Al D�a', 5000, true),
('8650359-k', 'Jaime Soto Acuña', 'Sociólogo', 'jaimesotoa@gmail.com', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('17088620-8', 'Javiera Victoria Farías Gontupil', 'Médico Veterinario', 'javiera.farias.g@gmail.com', 'Metropolitana', 'Socio Activo', 'Al D�a', 5000, true),
('17803385-9', 'Jazmine Hanadi Helena Salum Villavicencio', 'Médico veterinaria', 'jazminesalum@gmail.com', 'Metropolitana', 'Socio Activo', 'Al D�a', 5000, true),
('16128310-k', 'José Sebastián Sandoval Díaz', 'Psicólogo', 'jsandoval@ubiobio.cl', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('16769231-1', 'Juan Francisco Quiroga Sepúlveda', 'Médico Veterinario', 'quiroga.francisco.juan@gmail.com', 'Bío Bío', 'Socio Activo', 'Al D�a', 5000, true),
('17797079-4', 'Leslie Nicole Vallejos Farias', 'Médico veterinaria', 'leslie.vallejos@veterinaria.uchile.cl', 'Valparaíso', 'Socio Activo', 'Al D�a', 5000, true),
('17632692-1', 'Leslie Valeria Gallardo Valdivia', 'Médica Veterinaria', 'lesval19@gmail.com', 'Bio Bio', 'Socio Activo', 'Al D�a', 5000, true),
('13837658-3', 'Maria Gabriela Mancilla Cruces', 'Medico Veterinaria', 'servet.bajosdemena@gmail.com', 'Metropolitana', 'Socio Activo', 'Al D�a', 5000, true),
('16857597-1', 'María Violeta Barrera Navarro', 'Médico Veterinaria', 'mvioletab@gmail.com', 'Valparaíso', 'Socio Activo', 'Al D�a', 5000, true),
('19809670-9', 'Mathias Eduardo Vera Jara', 'Médico Veterinario', 'mvera.medvet@gmail.com', 'Araucanía', 'Socio Activo', 'Al D�a', 5000, true),
('16471705-4', 'Nallinne Michelle Vergara Fuentes', 'Médico Veterinario', 'nallinne@gmail.com', 'Metropolitana', 'Socio Activo', 'Al D�a', 5000, true),
('17152833-k', 'Natalia Isadora Herrera Muñoz', 'Médico Veterinaria', 'issiherrera.vet@gmail.com', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('8519203-5', 'Olga Marianela', 'Pensionada', 'marian.agame@hotmail.com', 'Metropolitana', 'Socio Activo', 'Al D�a', 5000, true),
('10771097-3', 'Oscar Ignacio Cabezas Avila', 'Médico Veterinario', 'oscabeza@gmail.com', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('10693092-9', 'Pablo Teodoro Salah Jaar', 'Médico Veterinario', 'psalahj@gmail.com', 'Valparaíso', 'Socio Activo', 'Al D�a', 5000, true),
('15603381-2', 'Reinaldo Letelier Contreras', 'Médico veterinario', 'reinaldoletelier@gmail.com', 'Ñuble', 'Socio Activo', 'Al D�a', 5000, true),
('15609773-k', 'Rodrigo Andres Sánchez Morgado', 'Medico Veterinario', 'rodsanmor@gmail.com', 'Coquimbo', 'Socio Activo', 'Al D�a', 5000, true),
('19841635-5', 'Sebastián Omar Santibáñez Espinoza', 'Médico Veterinario', 'medvet.santibanez@gmail.com', 'Metropolitana', 'Socio Activo', 'Al D�a', 5000, true),
('18826105-1', 'Vanessa María Maya Fairlie', 'Médica veterinaria', 'vanessa.mayaf@gmail.com', 'Bio Bio', 'Socio Activo', 'Al D�a', 5000, true)
ON CONFLICT (rut) DO NOTHING;

-- =========================================================================
-- LISTO. 46 socios insertados.
-- Actualizando fecha de registro ministerial e inicio de cuota en Septiembre.
-- =========================================================================

UPDATE public.socios 
SET 
  fecha_ingreso = '2025-11-17',
  estado_cuota = 'Al Día',
  ultima_cuota_pagada = 'Agosto 2026'
WHERE email != 'ag.pruaned@gmail.com';
