import re

# Raw text from OCR page by page
page_1_motto = "“Por la inclusión de los animales en la gestión del riesgo de desastres”"
page_1_title_1 = "ASOCIACIÓN GREMIAL DE PROFESIONALES UNIDOS POR LOS ANIMALES EN EMERGENCIAS Y DESASTRES"
page_1_title_2 = "(PRUANED A.G)"
page_1_subtitle = "ESTATUTOS Y REGLAMENTO GENERAL DE FUNCIONAMIENTO"
page_1_year = "2025"

index_title = "ÍNDICE"
index_items = [
    ("ÍNDICE", "2"),
    ("CAPÍTULO I: DENOMINACIÓN, NATURALEZA, DOMICILIO Y DURACIÓN", "3"),
    ("CAPÍTULO II: OBJETO, FINES Y PRINCIPIOS", "3"),
    ("CAPÍTULO III: DE LOS SOCIOS Y VOLUNTARIOS", "4"),
    ("CAPÍTULO IV: ÓRGANOS DE LA ASOCIACIÓN", "5"),
    ("CAPÍTULO V: DE LA ASAMBLEA GENERAL", "5"),
    ("CAPÍTULO VI: DEL DIRECTORIO NACIONAL", "6"),
    ("CAPÍTULO VII: DE LAS DIRECCIONES TÉCNICAS Y TEMÁTICAS", "7"),
    ("CAPÍTULO VIII: RÉGIMEN ECONÓMICO, TRANSPARENCIA Y DONACIONES", "9"),
    ("CAPÍTULO IX: COMISIÓN REVISORA DE CUENTAS", "10"),
    ("CAPÍTULO X: RÉGIMEN ELECTORAL, REFORMAS Y DISOLUCIÓN", "11"),
    ("CAPÍTULO XI: REGLAMENTO DEL VOLUNTARIADO", "12"),
    ("ANEXO TÉCNICO: ESTRUCTURA JERÁRQUICA Y COORDINACIÓN INTERINSTITUCIONAL", "14")
]

# Exact text blocks from original OCR
body_elements = [
    # CAPÍTULO I
    ("chapter", "CAPÍTULO I: DENOMINACIÓN, NATURALEZA, DOMICILIO Y DURACIÓN."),
    ("p", "Artículo 1°. Denominación. Constituyese una asociación gremial denominada “Asociación Gremial Profesionales Unidos por los Animales en Emergencias y Desastres”, pudiendo usar indistintamente ante cualquier autoridad y ante cualquier persona jurídica o natural la sigla “PRUANED A.G”, regida por el Decreto Ley N° 2.757 de 1979, sus reglamentos y las demás normas que le sean aplicables, así como por los presentes Estatutos y sus Reglamentos internos."),
    ("p", "Artículo 2°. PRUANED A.G es una entidad gremial, interdisciplinaria, técnica y profesional, de derecho privado, sin fines de lucro, independiente de toda actividad político-partidista o religiosa y enfocado al desarrollo social."),
    ("p", "Se inspira en los principios de One Health y One Welfare, reconociendo la interdependencia entre la salud humana, animal y medio ambiental, alineándose con el Marco de Sendai 2015–2030, con los objetivos de desarrollo sostenible (ODS) y la Política Nacional para la Reducción del Riesgo de Desastres."),
    ("p", "La Asociación fomentará la colaboración con organismos públicos, privados, académicos y comunitarios vinculados a la gestión y reducción del riesgo de desastres con componente animal."),
    ("p", "Artículo 3°. Personalidad y patrimonio. La Asociación goza de personalidad jurídica y patrimonio propio, pudiendo adquirir, conservar y enajenar bienes de toda clase, a cualquier título, de conformidad con la normativa vigente."),
    ("p", "Artículo 4°. Domicilio. El domicilio legal de la Asociación será Avenida Andes N°338, comuna San Fabián de Alico, Región de Ñuble, Chile, pudiendo modificarse por acuerdo del Directorio Nacional."),
    ("p", "Sin perjuicio de ello, podrá establecer filiales, oficinas regionales o representaciones en cualquier localidad del país."),
    ("p", "Artículo 5°. Duración. La duración de la Asociación será indefinida, mientras subsistan sus fines."),

    # CAPÍTULO II
    ("chapter", "CAPÍTULO II: OBJETO, FINES Y PRINCIPIOS."),
    ("p", "Artículo 6°. Objeto. PRUANED A.G tiene por objeto agrupar a profesionales, técnicos y personal operativo capacitado vinculados a la Gestión Integral del Riesgo de Desastres (GIRD) con enfoque en la dimensión animal, promoviendo su inclusión transversal en todas las fases del ciclo del riesgo: mitigación, preparación, respuesta y recuperación, así como en la educación y participación comunitaria."),
    ("p", "Artículo 7°. Fines específicos. Son fines de PRUANED A.G:"),
    ("list_letter", [
        ("a)", "Promover la inclusión de la variable animal en la planificación comunal, regional nacional e internacional en emergencias y desastres."),
        ("b)", "Elaborar, actualizar y difundir protocolos técnicos para animales de compañía, animales de producción, animales de granja, fauna silvestre y especies hidrobiológicas."),
        ("c)", "Fortalecer la formación, certificación y capacitación continua de sus miembros y de su voluntariado."),
        ("d)", "Fomentar la investigación científica aplicada y la generación de evidencia para la toma de decisiones."),
        ("e)", "Articular cooperación con organismos públicos, privados, académicos y comunitarios, nacionales e internacionales."),
        ("f)", "Impulsar acciones de educación y preparación comunitaria."),
        ("g)", "Desarrollar proyectos, convenios y fondos orientados al bienestar y protección animal en contextos de desastre."),
        ("h)", "Promover estándares de ética profesional, transparencia, enfoque intercultural e inclusivo, bienestar integral y autocuidado de los equipos humanos.")
    ]),
    ("p", "Artículo 8°. Principios rectores. La Asociación adhiere a los principios de legalidad, probidad, transparencia, solidaridad, no discriminación, respeto por los pueblos originarios, derechos humanos, precaución, sostenibilidad ambiental, bienestar integral, autocuidado y trabajo interdisciplinario."),

    # DEL FUNCIONAMIENTO
    ("sub_chapter", "DEL FUNCIONAMIENTO DE LA ASOCIACIÓN"),
    ("p", "Artículo 8 bis. La Asociación contará con una estructura de carácter administrativo-directivo y una estructura técnico-operativa, ambas complementarias para el cumplimiento de sus fines institucionales."),
    ("list_letter", [
        ("a)", "Estructura Directiva Administrativa: Corresponderá al Directorio Nacional de la Asociación, compuesto por Presidente/a, Vicepresidente/a, Secretario/a y Tesorero/a, quienes ejercerán la representación legal, administrativa, financiera y corporativa de la organización, conforme a los presentes estatutos y la normativa vigente."),
        ("b)", "Estructura Técnico Operativa: Estructura técnica de respuesta. La Asociación podrá conformar una estructura técnico-operativa permanente o transitoria destinada a la preparación, coordinación, despliegue y ejecución de acciones relacionadas con la respuesta a emergencias o desastres en la dimensión animal. Esta estructura podrá activarse en situaciones de emergencia, desastre, contingencias sanitarias, operativos preventivos, entrenamientos o ejercicios de simulación.")
    ]),

    # CAPÍTULO III
    ("chapter", "CAPÍTULO III: DE LOS SOCIOS Y VOLUNTARIOS."),
    ("p", "Artículo 9°. Categorías. Podrán incorporarse personas naturales o jurídicas que ejerzan profesión, oficio o labor afín al objeto de la Asociación."),
    ("p", "La Asociación podrá contar con voluntarios, profesionales, técnicos, brigadistas, colaboradores y personal operativo destinado al cumplimiento de sus fines institucionales."),
    ("p", "La organización podrá establecer mecanismos de:reclutamiento - formación - convenios - capacitación - acreditación interna - certificación - evaluación de competencias credenciales operativas"),
    ("p", "El Directorio podrá establecer requisitos mínimos de ingreso, permanencia y participación en operaciones de emergencia."),
    ("p", "Se establecen las siguientes categorías:"),
    ("list_letter", [
        ("i)", "Socios Activos (voz y voto)."),
        ("ii)", "Socios Adherentes (voz sin voto)."),
        ("iii)", "Socios Honorarios."),
        ("iv)", "Colaboraciones Institucionales (universidades, ONG o entidades colaboradoras sin fines de lucro)."),
        ("v)", "Voluntarios Permanentes."),
        ("vi)", "Voluntarios Espontáneos.")
    ]),
    ("p", "El Directorio Nacional mantendrá un registro actualizado de las categorías y sus respectivos derechos y deberes."),
    ("p", "Artículo 10°. Requisitos de ingreso. La incorporación requerirá solicitud escrita o electrónica, acreditación de competencias, aceptación de estatutos y reglamentos, y acuerdo del Directorio. Los voluntarios permanentes deberán aprobar inducción y acreditar formación básica en seguridad y primeros auxilios veterinarios; los voluntarios espontáneos cumplirán inducción abreviada."),
    ("p", "Artículo 11°. Derechos. Son derechos: participar en actividades y programas; acceder a información y capacitación; postular a cargos (según categoría); votar (si corresponde); y recibir acreditación y apoyo institucional en terreno."),
    ("p", "Artículo 12°. Deberes. Son deberes de los socios y voluntarios:"),
    ("list_letter", [
        ("a)", "Observar los estatutos, reglamentos y protocolos institucionales."),
        ("b)", "Cumplir las normas de seguridad, bioseguridad y autocuidado personal."),
        ("c)", "Mantener conducta ética, profesional y solidaria."),
        ("d)", "Resguardar datos personales y sensibles."),
        ("e)", "Usar correctamente insignias y uniforme institucional."),
        ("f)", "Mantener al día las cuotas u obligaciones si procediere.")
    ]),
    ("p", "Los asociados deberán mantener una participación activa y responsable en las actividades formales convocadas por la Asociación, incluyendo asambleas, reuniones ordinarias, reuniones extraordinarias, capacitaciones obligatorias y otras instancias definidas por el Directorio."),
    ("p", "Se considerará incumplimiento grave la inasistencia injustificada reiterada a reuniones oficialmente convocadas."),
    ("p", "Se entenderá como inasistencia reiterada:"),
    ("list_letter", [
        ("a)", "faltar injustificadamente a tres reuniones consecutivas, o"),
        ("b)", "faltar injustificadamente a cinco reuniones dentro de un período de doce meses.")
    ]),
    ("p", "El asociado por medio digital, electrónico o escrito deberá comunicar su imposibilidad de asistir."),
    ("p", "Ante incumplimiento reiterado, el Directorio podrá aplicar progresivamente las siguientes medidas: amonestación verbal, amonestación escrita, suspensión temporal de derechos como asociado, pérdida de cargos internos o funciones operativas."),
    ("p", "Todo procedimiento deberá garantizar el derecho del asociado a presentar sus descargos."),
    ("p", "La conducta ética será supervisada por un Comité de Ética, órgano asesor del Directorio, encargado de conocer y resolver situaciones de naturaleza ética o disciplinaria, conforme al reglamento interno."),
    ("p", "Artículo 13°. Padrón y protección de datos. La Secretaría llevará registro actualizado de socios y voluntarios, resguardando la confidencialidad y tratamiento de datos de acuerdo con la ley. Se podrán emitir credenciales físicas o digitales."),
    ("p", "Artículo 14°. Suspensión y pérdida de la calidad de socio/voluntario. Procederá por renuncia, fallecimiento, mora grave, incumplimiento ético o disciplinario, acciones que atenten contra la organización y sus objetivos, asumir roles no asignados o por acuerdo fundado de la Asamblea, garantizando debido proceso y derecho a defensa. El Comité de Ética podrá emitir informes o recomendaciones previas a la decisión del Directorio o la Asamblea, según la gravedad del caso."),

    # CAPÍTULO IV
    ("chapter", "CAPÍTULO IV: ÓRGANOS DE LA ASOCIACIÓN."),
    ("p", "Artículo 15°. Órganos. Son órganos de PRUANED A.G: a) la Asamblea General; b) el Directorio Nacional; c) las Direcciones Técnicas y Temáticas; y d) la Comisión Revisora de Cuentas. El Consejo Asesor Técnico no formará parte de la estructura orgánica."),
    ("p", "Artículo 16°. Reglas comunes. Todos los órganos deberán actuar con sujeción a los Estatutos, reglamentos y acuerdos de la Asamblea; llevarán actas de sus sesiones; y se regirán por principios de probidad y transparencia."),

    # CAPÍTULO V
    ("chapter", "CAPÍTULO V: DE LA ASAMBLEA GENERAL."),
    ("p", "Artículo 17°. Integración y funciones. La Asamblea General es el órgano supremo, integrada por los socios activos. Son sus atribuciones: elegir y remover al Directorio; aprobar memoria y balance; fijar cuotas; aprobar modificaciones estatutarias; autorizar actos o contratos de especial relevancia; y resolver asuntos de alta importancia institucional."),
    ("p", "Artículo 18°. Sesiones y periodicidad. La Asamblea se reunirá en sesiones ordinarias al menos dos veces al año y en sesiones extraordinarias cuando lo requiera el Directorio o un tercio de los socios activos. Podrá sesionar y votar por medios electrónicos que aseguren identidad y simultaneidad."),
    ("p", "Artículo 19°. Convocatoria y quórum. La citación se realizará con al menos diez días corridos de anticipación, por medios físicos, electrónicos y/o por canales oficiales de comunicación."),
    ("p", "El quórum para sesionar será de la mitad más uno (50% + 1) de los socios activos en primera citación, y los presentes en segunda citación."),
    ("p", "Se podrán realizar asambleas extraordinarias de emergencia con citación de al menos 24 horas de anticipación."),
    ("p", "Los acuerdos se adoptarán por mayoría simple, salvo materias que exijan quórum especial."),
    ("p", "Artículo 20°. Modificaciones estatutarias y disolución. Las reformas estatutarias requerirán el voto favorable de dos tercios de los socios activos presentes. La disolución se resolverá conforme a lo establecido en el Capítulo X."),
    ("p", "Artículo 21°. Actas. De toda sesión se levantará acta por el Secretario, la que consignará asistentes, acuerdos, votos y disidencias; será aprobada y firmada por el Presidente y el Secretario."),

    # CAPÍTULO VI
    ("chapter", "CAPÍTULO VI: DEL DIRECTORIO NACIONAL."),
    ("p", "Artículo 22°. Integración y período. El Directorio Nacional estará compuesto por un Presidente, un Vicepresidente, un Secretario y un Tesorero. Durarán cuatro (4) años en sus cargos y podrán ser reelectos por una sola vez consecutiva."),
    ("p", "Artículo 23°. Requisitos e inhabilidades. Para integrar el Directorio se requerirá ser socio activo y no encontrarse inhabilitado por sentencia o sanción disciplinaria."),
    ("p", "Durante los primeros cinco años de funcionamiento de PRUANED A.G, no será exigible antigüedad mínima para integrar el Directorio."),
    ("p", "Transcurrido dicho período, la Asamblea General o el reglamento interno podrá establecer requisitos de antigüedad para determinados cargos directivos."),
    ("p", "Artículo 24°. Sesiones y quórum. El Directorio sesionará ordinariamente una vez al mes y extraordinariamente cuando lo convoque el Presidente o dos de sus miembros. El quórum será de tres directores; los acuerdos se adoptarán por mayoría simple; en caso de empate decidirá el voto del Presidente."),
    ("p", "Artículo 25°. Funciones del Directorio. Corresponde al Directorio: ejecutar los acuerdos de la Asamblea; dirigir la administración; aprobar planes anuales, presupuestos y estados financieros; supervisar las Direcciones Técnicas; designar o remover directores de área y subcoordinadores; dictar reglamentos internos; y desarrollar funciones de planificación y respuesta en RRD y GRD, coordinando con autoridades competentes."),
    ("p", "Artículo 26°. Presidente. Son funciones del Presidente: representar judicial y extrajudicialmente a PRUANED A.G; convocar y presidir la Asamblea y el Directorio; firmar contratos y convenios previa aprobación; velar por el cumplimiento de estatutos y protocolos; y liderar la coordinación estratégica en emergencias."),
    ("p", "Artículo 27°. Vicepresidente. Son funciones del Vicepresidente: subrogar al Presidente en caso de ausencia; coordinar relaciones institucionales y alianzas; supervisar la ejecución de proyectos y apoyar la articulación de las Direcciones Técnicas y socios. Apoyar la conducción estratégica de la Asociación."),
    ("p", "Artículo 28°. Secretario. Son funciones del Secretario: llevar el registro de socios y voluntarios; custodiar libros y documentación; redactar y autorizar actas; cursar citaciones; custodiar archivos digitales; y gestionar la transparencia documental interna."),
    ("p", "Artículo 29°. Tesorero. Son funciones del Tesorero: administrar los recursos; llevar contabilidad y estados financieros; proponer el presupuesto anual; supervisar la correcta canalización de donaciones vía ONG donataria con convenio vigente; rendir cuentas trimestrales al Directorio y anuales a la Asamblea; y proponer políticas de adquisiciones y control interno."),
    ("p", "Artículo 30°. Vacancias, subrogaciones y remoción. La vacancia por renuncia, fallecimiento, remoción o inasistencia reiterada será provista por la Asamblea en sesión extraordinaria dentro de 30 días. El Vicepresidente subrogará al Presidente; a falta de éste, lo hará el Secretario y luego el Tesorero. La remoción de directores procederá por incumplimiento grave, con debido proceso y mayoría absoluta de la Asamblea."),

    # CAPÍTULO VII
    ("chapter", "CAPÍTULO VII: DE LAS DIRECCIONES TÉCNICAS Y TEMÁTICAS."),
    ("p", "Artículo 31°. Estructura y designación. Existirán las siguientes Direcciones: (1) Voluntariado; (2) One Health; (3) RRD–GRD; (4) Pueblos Originarios; (5) Alianzas, Convenios y Donaciones; (6) Mascota;(7) Animales de Producción (ganado, aves, abejas); y (8) Fauna Silvestre. Cada Dirección contará con un Director y un Subcoordinador, designados por el Directorio por períodos de dos años, renovables."),
    ("p", "Artículo 32°. Reglas comunes. Las Direcciones elaborarán planes anuales de trabajo con metas, indicadores y presupuesto estimado; reportarán trimestralmente al Directorio; coordinarán entre sí y con autoridades; y deberán ajustar su actuación a protocolos vigentes."),
    ("p", "Artículo 33°. Dirección de Voluntariado. Objetivo: gestionar el ciclo completo del voluntariado permanente y espontáneo. Funciones: reclutamiento, inducción, acreditación, bienestar y seguridad; plan de formación; base de datos nacional; asignación a operativos; seguimiento psicosocial; control de uso de credenciales e imagen institucional; y evaluación post evento."),
    ("p", "Artículo 34°. Dirección One Health. Objetivo: integrar salud animal, humana y ambiental en políticas, programas y operativos. Funciones: coordinación con instituciones de salud pública y medio ambiente; vigilancia y prevención de zoonosis; protocolos de bioseguridad; educación sanitaria; e investigación interdisciplinaria aplicada."),
    ("p", "Artículo 35°. Dirección RRD–GRD. Objetivo: planificar y ejecutar medidas de reducción del riesgo y respuesta ante desastres. Funciones: análisis de riesgo; mapas de amenaza y exposición animal; protocolos operativos; coordinación con SENAPRED, SAG, municipios y cuerpos de emergencia; mando y control durante operativos; evaluación de daños y necesidades; y lecciones aprendidas."),
    ("p", "Artículo 36°. Dirección de Pueblos Originarios. Objetivo: incorporar saberes, cosmovisiones y prácticas territoriales. Funciones: vinculación con comunidades indígenas; enfoque intercultural en protocolos; consulta y participación; y pertinencia cultural en albergues y operativos."),
    ("p", "Artículo 37°. Dirección de Alianzas, Convenios y Donaciones. Objetivo: fortalecer cooperación y financiamiento. Funciones: gestión de convenios; articulación con ONG donataria con convenio vigente; búsqueda de fondos; administración documental de donaciones; y rendición pública coordinada con Tesorería."),
    ("p", "Artículo 38°. Dirección de Mascotas. Objetivo: protección de animales de compañía. Funciones: rescate, atención primaria, reunificación, albergues temporales, protocolos de tenencia responsable, y capacitación comunitaria."),
    ("p", "Artículo 39°. Dirección de Animales de Producción. Objetivo: continuidad productiva y bienestar animal en emergencias. Funciones: planes de contingencia alimentaria e hídrica; coordinación con servicios agropecuarios; protocolos para ganado, aves y abejas; y asesoría a productores para mitigación y recuperación."),
    ("p", "Artículo 40°. Dirección de Fauna Silvestre. Objetivo: rescate, rehabilitación y liberación segura de fauna afectada. Funciones: coordinación con centros de rehabilitación; protocolos de captura y traslado; monitoreo post-evento; y educación para la conservación."),
    ("p", "Artículo 41°. Comisiones y grupos de trabajo. Cada Dirección podrá proponer comisiones temáticas o territoriales ad hoc, aprobadas por el Directorio, con objetivos, plazos y productos definidos."),

    # CAPÍTULO VIII
    ("chapter", "CAPÍTULO VIII: RÉGIMEN ECONÓMICO, TRANSPARENCIA Y DONACIONES."),
    ("p", "Artículo 42°. Patrimonio. El patrimonio se conforma por cuotas de socios, aportes voluntarios, donaciones, legados, subvenciones, ingresos por actividades y todo otro ingreso lícito compatible con su naturaleza no lucrativa. Los socios podrán elevar una solicitud al directorio nacional para la suspensión temporal de las cuotas de socio de manera justifica y por un periodo de tiempo definido sin perjudicar que este pueda ser extendido en el tiempo si el socio lo solicita."),
    ("p", "Artículo 43°. Administración financiera. La Tesorería llevará contabilidad fidedigna; cuentas bancarias a nombre de PRUANED A.G; presupuesto anual; y políticas de adquisiciones y caja chica. Todo egreso requerirá respaldo y doble firma o firma electrónica avanzada (Presidente y Tesorero o quien designe el directorio)."),
    ("p", "Artículo 44°. Donaciones con beneficio tributario. Las donaciones que otorguen beneficios tributarios serán canalizadas exclusivamente a través de organizaciones sin fines de lucro donatarias con convenio vigente con la Asociación, y transferirá recursos conforme a los fines aprobados. Asimismo, podrá recibir cuotas y aportes directos sin beneficio tributario."),
    ("p", "Artículo 45°. Rendición y publicidad activa. La Tesorería presentará estados financieros trimestrales al Directorio y balance anual a la Asamblea. Se publicará un informe resumido anual para los socios en el sitio o medios institucionales."),
    ("p", "Artículo 46°. Prevención de conflictos de interés. Todo director, socio o miembro que tenga interés personal, en un contrato, donación, convenio o cualquier otro acto que involucre recursos o beneficios institucionales, deberá informar dicha situación e inhabilitarse de la discusión y votación correspondiente, dejándose constancia en acta."),
    ("p", "El incumplimiento de esta obligación será considerado falta grave y podrá ser sancionado según el reglamento interno."),
    ("p", "Artículo 47°. Auditoría y control. La Comisión Revisora de Cuentas ejercerá control interno y podrá recomendar auditorías externas independientes."),

    # CAPÍTULO IX
    ("chapter", "CAPÍTULO IX: COMISIÓN REVISORA DE CUENTAS."),
    ("p", "Artículo 48°. Integración y período. La Comisión Revisora de Cuentas estará compuesta por tres socios activos, elegidos por la Asamblea por un período de dos años, pudiendo ser reelegidos alternadamente. No podrán integrar el Directorio ni tener cargos remunerados en la Asociación."),
    ("p", "Artículo 49°. Funciones. Revisar trimestralmente la documentación contable; emitir informes semestrales al Directorio y un informe anual a la Asamblea; verificar cumplimiento de políticas financieras; proponer mejoras de control interno; y requerir antecedentes a Tesorería."),
    ("p", "Artículo 50°. Facultades y acceso a información. Tendrá acceso a libros y respaldos contables, contratos y convenios, resguardando la confidencialidad de datos personales y sensibles."),
    ("p", "Artículo 51°. Remoción y vacancias. Sus miembros podrán ser removidos por causa justificada por la Asamblea. Las vacancias se proveerán en sesión extraordinaria."),

    # CAPÍTULO X
    ("chapter", "CAPÍTULO X: RÉGIMEN ELECTORAL, REFORMAS Y DISOLUCIÓN."),
    ("p", "Artículo 52°. Comité Electoral. Para cada elección de Directorio se conformará un Comité Electoral de tres miembros designados por la Asamblea, responsables de proponer calendario, velar por la publicidad, resolver reclamaciones y escrutar votos."),
    ("p", "Artículo 53°. Elecciones y período. Las elecciones se efectuarán cada cuatro (4) años mediante votación secreta, personal e intransferible, presencial o por medios electrónicos seguros. Los directores podrán ser reelectos por una sola vez consecutiva."),
    ("p", "Artículo 54°. Candidaturas y propaganda. Las candidaturas se declararán por escrito ante el Comité Electoral con al menos 20 días de anticipación. La propaganda deberá respetar principios éticos y no podrá comprometer recursos de la Asociación."),
    ("p", "Artículo 55°. Escrutinio y proclamación. Terminado el acto electoral, el Comité realizará escrutinio público, levantará acta y proclamará al Directorio electo."),
    ("p", "Artículo 56°. Vacancias y subrogaciones. Las vacancias del Directorio se proveerán conforme al artículo 30. El Directorio podrá designar subrogancias temporales hasta la ratificación por la Asamblea."),
    ("p", "Artículo 57°. Reformas de estatutos. Las reformas requerirán acuerdo de Asamblea Extraordinaria con el voto favorable de dos tercios de los socios activos presentes; deberán depositarse e inscribirse conforme a derecho."),
    ("p", "Artículo 58°. Disolución. La disolución será acordada por Asamblea Extraordinaria con el mismo quórum de reforma. Los bienes se destinarán a una entidad sin fines de lucro con fines similares, designada por la Asamblea."),
    ("p", "Artículo 59°. Norma supletoria y vigencia. En lo no previsto, regirá el Decreto Ley N° 2.757 de 1979 y la normativa complementaria aplicable. Estos Estatutos entrarán en vigencia desde su aprobación por la Asamblea Constitutiva y su depósito e inscripción correspondientes."),

    # CAPÍTULO XI
    ("chapter", "CAPÍTULO XI: REGLAMENTO DEL VOLUNTARIADO."),
    ("p", "Artículo 60°. Naturaleza. El voluntariado constituye el cuerpo operativo esencial de PRUANED A.G, integrado por personas que, en forma libre y solidaria, contribuyen a las actividades de prevención, preparación, respuesta y recuperación en emergencias y desastres que afectan a los animales. Sólo podrán participar en operaciones de respuesta quienes cumplan los estándares técnicos."),
    ("p", "Artículo 61°. Categorías. Se reconocen dos modalidades: a) Voluntarios Permanentes: inscritos, acreditados y capacitados regularmente, con derechos y deberes plenos; y b) Voluntarios Espontáneos: personas que, en situaciones de emergencia, se incorporan temporalmente bajo inducción abreviada."),
    ("p", "Artículo 62°. Derechos. Son derechos de los voluntarios: recibir inducción, capacitación y acreditación; ser informados de riesgos y protocolos; participar en actividades de formación; y recibir diploma de participación."),
    ("p", "Artículo 63°. Deberes. Son deberes: respetar la autoridad de mandos designados; cumplir normas de seguridad y bioseguridad; portar credencial y uniforme cuando corresponda; mantener conducta ética; y abstenerse de representar públicamente a PRUANED A.G, sin autorización."),
    ("p", "Artículo 64°. Ingreso y acreditación. El ingreso de voluntarios permanentes requerirá solicitud, entrevista, capacitación básica y firma de compromiso. Los voluntarios espontáneos deberán registrar sus datos y aprobar inducción abreviada antes de integrarse a operativos."),
    ("p", "Artículo 65°. Inducción y formación. Sujeto siempre a la disponibilidad presupuestaria y operativa de la organización, los voluntarios deberán aprobar cursos de inducción en ética, seguridad, GRD y bienestar animal. Se establecerán niveles de acreditación progresiva según experiencia."),
    ("p", "Artículo 66°. Uniforme e insignias. El uso de uniforme e insignias institucionales será regulado por el Directorio y su indebido uso será sancionado disciplinariamente."),
    ("p", "Artículo 67°. Bienestar y apoyo. La Asociación velará, en la medida de sus posibilidades, por un entorno seguro para sus voluntarios. En caso de eventos complejos, la asociación podrá orientar, facilitar o derivar a los voluntarios a redes de apoyo psicosocial externas, quedando la Asociación exenta de costos económicos directos derivados de tratamientos médicos o terapéuticos individuales."),
    ("p", "Artículo 68°. Régimen disciplinario. Las faltas se clasificarán en leves, graves y muy graves, conforme al reglamento interno:"),
    ("list_bullet", [
        ("Faltas leves:", "advertencia o amonestación escrita."),
        ("Faltas graves:", "suspensión temporal de derechos o funciones hasta 6 meses."),
        ("Faltas muy graves:", "exclusión definitiva de la Asociación.")
    ]),
    ("p", "El procedimiento disciplinario asegurará derecho a defensa, instancia de apelación y registro en acta."),
    ("p", "Las decisiones serán revisadas por el Comité de Ética, que actuará como instancia técnica de evaluación y asesoría al Directorio."),
    ("p", "Artículo 69°. Reconocimiento. La Asociación establecerá mecanismos de reconocimiento y certificación pública de sus voluntarios destacados, fomentando la permanencia y profesionalización del voluntariado."),

    # ANEXO TÉCNICO
    ("chapter", "ANEXO TÉCNICO: ESTRUCTURA JERÁRQUICA Y COORDINACIÓN INTERINSTITUCIONAL."),
    ("p", "Artículo 70°. Niveles de actuación. La estructura operativa de PRUANED A.G, se organizará en tres niveles: a) Nivel Estratégico: Asamblea General y Directorio Nacional, responsables de políticas, planificación y vínculos interinstitucionales; b) Nivel Táctico: Direcciones Técnicas, responsables de planificación sectorial, coordinación regional y supervisión de equipos; c) Nivel Operativo: voluntarios permanentes y espontáneos, desplegados en terreno para la ejecución de acciones directas."),
    ("p", "Artículo 71°. Jerarquía funcional. Durante emergencias, la cadena de mando será: Presidente → Directorio Nacional → Direcciones Técnicas → Coordinadores de Operativo → Voluntarios. Esta jerarquía podrá adaptarse según la naturaleza y magnitud del evento."),
    ("p", "En situaciones de emergencia o fuerza mayor declaradas por el Directorio, se suspenderá la estructura lineal de mando único, activándose un régimen de facultades distribuidas y delegación de firma ejecutiva entre los miembros del Directorio para garantizar la representación y defensa del gremio de forma oportuna."),
    ("p", "Artículo 72°. Coordinación institucional. La Asociación coordinará su actuación con el SENAPRED, el SAG, municipios, servicios públicos pertinentes, universidades y ONG afines. Los convenios formales definirán responsabilidades, protocolos y estándares de actuación conjunta."),
    ("p", "Artículo 73°. Protocolos de actuación. Se elaborarán manuales y procedimientos para la gestión interinstitucional, interoperabilidad en terreno, comunicación y logística. Dichos documentos serán actualizados periódicamente con base en lecciones aprendidas y normativa vigente."),
    ("p", "Artículo 74°. Transparencia y rendición de cuentas. Toda coordinación externa deberá quedar registrada en informes técnicos, disponibles para socios y autoridades competentes. Se fomentará la transparencia como principio transversal en todas las relaciones interinstitucionales."),
    ("sub_chapter", "Régimen extraordinario para emergencias y desastres"),
    ("p", "Artículo 75°. En caso de emergencia, desastre, catástrofe, crisis sanitaria, contingencia ambiental o cualquier evento que requiera respuesta inmediata relacionada con animales, salud pública veterinaria o gestión del riesgo, el Directorio podrá declarar estado operativo extraordinario institucional."),
    ("p", "Bajo esta condición, la Asociación podrá:"),
    ("list_letter", [
        ("a)", "movilizar voluntarios y equipos técnicos para los fines que estime conveniente la asociación"),
        ("b)", "ejecutar compras urgentes de insumos médicos, logísticos o humanitarios"),
        ("c)", "habilitar centros de atención temporal, hospitales de campaña, albergues o centros de rehabilitación"),
        ("d)", "gestionar donaciones"),
        ("e)", "celebrar acuerdos operativos temporales"),
        ("f)", "contratar servicios urgentes necesarios para la respuesta"),
        ("g)", "activar coordinaciones regionales"),
        ("h)", "desplegar recursos humanos y materiales dentro del territorio nacional")
    ]),
    ("p", "Estas acciones deberán ser coordinadas con el Directorio y registradas administrativamente para fines de control interno y transparencia institucional.")
]

# Generate HTML with 100% exact text preservation
html_parts = []
html_parts.append("""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Estatutos y Reglamento General de Funcionamiento - PRUANED A.G</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@500;600;700;800;900&display=swap" rel="stylesheet">

  <style>
    @page {
      size: A4;
      margin: 22mm 16mm 22mm 16mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1E293B;
      background-color: #FFFFFF;
      margin: 0;
      padding: 0;
      font-size: 9.5pt;
      line-height: 1.6;
    }

    h1, h2, h3, h4, h5, h6, .font-heading {
      font-family: 'Outfit', sans-serif;
      color: #0C2340;
    }

    p {
      margin-top: 0;
      margin-bottom: 0.7rem;
      text-align: justify;
      text-justify: inter-word;
    }

    strong, b {
      color: #0F172A;
      font-weight: 700;
    }

    .page-break {
      page-break-before: always;
      break-before: page;
    }

    .avoid-break {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .cover-page {
      height: 250mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      padding: 6mm 4mm;
      position: relative;
      background: radial-gradient(circle at 50% 30%, #F8FAFC 0%, #FFFFFF 100%);
      border: 1px solid #E2E8F0;
      border-radius: 16px;
    }

    .cover-header-stripe {
      width: 100%;
      height: 6px;
      background: linear-gradient(90deg, #E63946 0%, #FFB703 25%, #1B8A44 50%, #0066B2 75%, #0C2340 100%);
      border-radius: 3px;
      margin-bottom: 10mm;
    }

    .cover-top-motto {
      font-size: 11pt;
      color: #0066B2;
      font-weight: 600;
      font-style: italic;
      background: #F0F7FF;
      padding: 8px 24px;
      border-radius: 20px;
      border: 1px solid #BAE6FD;
      display: inline-block;
      margin-bottom: 6mm;
      box-shadow: 0 2px 6px rgba(0, 102, 178, 0.06);
    }

    .cover-title {
      font-family: 'Outfit', sans-serif;
      font-size: 17.5pt;
      font-weight: 800;
      color: #0C2340;
      line-height: 1.3;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      max-width: 95%;
      margin: 0 auto 4mm auto;
    }

    .cover-subtitle-sigla {
      font-family: 'Outfit', sans-serif;
      font-size: 16pt;
      font-weight: 700;
      color: #E63946;
      margin-bottom: 6mm;
      letter-spacing: 1.5px;
    }

    .cover-logo-container {
      margin: 4mm 0;
      padding: 12px;
      background: #FFFFFF;
      border-radius: 24px;
      box-shadow: 0 10px 30px -5px rgba(12, 35, 64, 0.08);
      border: 1px solid #F1F5F9;
      display: inline-block;
    }

    .cover-logo-container img {
      width: 230px;
      height: auto;
      display: block;
    }

    .cover-doc-name-badge {
      background: linear-gradient(135deg, #0C2340 0%, #1E3A8A 100%);
      color: #FFFFFF;
      padding: 12px 30px;
      border-radius: 12px;
      margin-top: 4mm;
      box-shadow: 0 4px 14px rgba(12, 35, 64, 0.16);
    }

    .cover-doc-name-badge h2 {
      color: #FFFFFF;
      font-size: 13pt;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.8px;
    }

    .cover-year {
      font-family: 'Outfit', sans-serif;
      font-size: 16pt;
      font-weight: 800;
      color: #1B8A44;
      margin-top: 5mm;
      letter-spacing: 2px;
    }

    .cover-footer-page-num {
      font-size: 10pt;
      color: #94A3B8;
      font-weight: 600;
      margin-top: 6mm;
    }

    .index-container {
      padding-top: 2mm;
    }

    .section-header-banner {
      background: linear-gradient(135deg, #0C2340 0%, #1E3A8A 100%);
      border-left: 6px solid #E63946;
      padding: 12px 18px;
      border-radius: 0 10px 10px 0;
      margin-bottom: 22px;
      box-shadow: 0 4px 12px rgba(12, 35, 64, 0.1);
    }

    .section-header-banner h2 {
      margin: 0;
      font-size: 16pt;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: 1.5px;
    }

    .index-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .index-item {
      display: flex;
      align-items: baseline;
      margin-bottom: 12px;
      font-size: 9.5pt;
    }

    .index-item .chapter-label {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      color: #0C2340;
      white-space: nowrap;
    }

    .index-item .dots-leader {
      flex: 1;
      border-bottom: 1px dotted #94A3B8;
      margin: 0 8px;
    }

    .index-item .page-num {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      color: #0066B2;
      background: #F0F7FF;
      padding: 2px 10px;
      border-radius: 4px;
      border: 1px solid #BAE6FD;
      font-size: 9pt;
    }

    .chapter-block {
      margin-top: 20px;
      margin-bottom: 12px;
      break-after: avoid;
    }

    .chapter-banner {
      background: linear-gradient(135deg, #0C2340 0%, #1E3A8A 100%);
      color: #FFFFFF;
      font-family: 'Outfit', sans-serif;
      font-size: 10pt;
      font-weight: 800;
      padding: 8px 16px;
      border-radius: 8px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      box-shadow: 0 3px 8px rgba(12, 35, 64, 0.12);
      border-left: 5px solid #0066B2;
      display: block;
    }

    .chapter-banner-sub {
      background: linear-gradient(135deg, #F8FAFC 0%, #EDF2F7 100%);
      color: #0C2340;
      font-family: 'Outfit', sans-serif;
      font-size: 10pt;
      font-weight: 800;
      padding: 8px 16px;
      border-radius: 8px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-left: 5px solid #1B8A44;
      margin-top: 14px;
      margin-bottom: 10px;
    }

    .article-box {
      margin-bottom: 12px;
      padding: 2px 0;
      break-inside: avoid-page;
    }

    .custom-list {
      list-style: none;
      padding-left: 0;
      margin-top: 6px;
      margin-bottom: 10px;
    }

    .custom-list li {
      position: relative;
      padding-left: 20px;
      margin-bottom: 6px;
      text-align: justify;
    }

    .custom-list li::before {
      content: "•";
      position: absolute;
      left: 4px;
      top: -1px;
      color: #0066B2;
      font-weight: bold;
      font-size: 12pt;
    }

    .lettered-list {
      list-style: none;
      padding-left: 0;
      margin-top: 6px;
      margin-bottom: 10px;
    }

    .lettered-list li {
      position: relative;
      padding-left: 24px;
      margin-bottom: 6px;
      text-align: justify;
    }

    .lettered-list li .list-prefix {
      position: absolute;
      left: 0;
      top: 0;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      color: #0066B2;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-header-stripe"></div>
    <div class="cover-top-motto">""" + page_1_motto + """</div>
    
    <div>
      <h1 class="cover-title">""" + page_1_title_1 + """</h1>
      <div class="cover-subtitle-sigla">""" + page_1_title_2 + """</div>
    </div>

    <div class="cover-logo-container">
      <img src="pruaned-logo-official.png" alt="PRUANED Logo Oficial">
    </div>

    <div>
      <div class="cover-doc-name-badge">
        <h2>""" + page_1_subtitle + """</h2>
      </div>
      <div class="cover-year">""" + page_1_year + """</div>
    </div>

    <div class="cover-footer-page-num">1</div>
  </div>

  <div class="page-break"></div>

  <!-- ÍNDICE -->
  <div class="index-container">
    <div class="section-header-banner">
      <h2>""" + index_title + """</h2>
    </div>

    <ul class="index-list">
""")

for label, pnum in index_items:
    html_parts.append(f"""      <li class="index-item">
        <span class="chapter-label">{label}</span>
        <span class="dots-leader"></span>
        <span class="page-num">{pnum}</span>
      </li>
""")

html_parts.append("""    </ul>
  </div>

  <div class="page-break"></div>
""")

# Render body elements with exact original text
for elem_type, data in body_elements:
    if elem_type == "chapter":
        html_parts.append(f"""  <div class="chapter-block">
    <div class="chapter-banner">{data}</div>
  </div>
""")
    elif elem_type == "sub_chapter":
        html_parts.append(f"""  <div class="chapter-block">
    <div class="chapter-banner-sub">{data}</div>
  </div>
""")
    elif elem_type == "p":
        # Check if starts with "Artículo" to style title part
        m = re.match(r'^(Artículo\s+[0-9º\.\s\w]+?\.\s*)(.*)', data)
        if m:
            art_num = m.group(1)
            rest = m.group(2)
            html_parts.append(f"""  <div class="article-box">
    <p><strong>{art_num}</strong>{rest}</p>
  </div>
""")
        else:
            html_parts.append(f"""  <div class="article-box">
    <p>{data}</p>
  </div>
""")
    elif elem_type == "list_letter":
        html_parts.append("""  <ul class="lettered-list">
""")
        for prefix, text in data:
            html_parts.append(f"""    <li><span class="list-prefix">{prefix}</span> {text}</li>
""")
        html_parts.append("""  </ul>
""")
    elif elem_type == "list_bullet":
        html_parts.append("""  <ul class="custom-list">
""")
        for prefix, text in data:
            html_parts.append(f"""    <li><strong>{prefix}</strong> {text}</li>
""")
        html_parts.append("""  </ul>
""")

html_parts.append("""</body>
</html>
""")

full_html = "".join(html_parts)

# Write to build_estatutos.py
python_file_content = f"""import os

html_content = \"\"\"{full_html}\"\"\"

os.makedirs("c:/PRUANED/public", exist_ok=True)
with open("c:/PRUANED/public/estatutos_redisenados.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("Exact 100% fidelity HTML written successfully to c:/PRUANED/public/estatutos_redisenados.html")
"""

with open("c:/PRUANED/build_estatutos.py", "w", encoding="utf-8") as f:
    f.write(python_file_content)

print("Updated build_estatutos.py with 100% exact OCR text!")
