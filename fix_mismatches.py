import re

# Update python file with exact byte-for-byte matching text
with open("c:/PRUANED/generate_exact_html.py", "r", encoding="utf-8") as f:
    content = f.read()

# Fix Artículo 14° text
old_art_14 = '"Artículo 14°. Suspensión y pérdida de la calidad de socio/voluntario. Procederá por renuncia, fallecimiento, mora grave, incumplimiento ético o disciplinario, acciones que atenten contra la organización y sus objetivos, asumir roles no asignados o por acuerdo fundado de la Asamblea, garantizando debido proceso y derecho a defensa. El Comité de Ética podrá emitir informes o recomendaciones previas a la decisión del Directorio o la Asamblea, según la gravedad del caso."'

content = content.replace(
    '("p", "Artículo 14°. Suspensión y pérdida de la calidad de socio/voluntario. Procederá por renuncia, fallecimiento, mora grave, incumplimiento ético o disciplinario, acciones que atenten contra la organización y sus objetivos, asumir roles no asignados o por acuerdo fundado de la Asamblea, garantizando debido proceso y derecho a defensa. El Comité de Ética podrá emitir informes o recomendaciones previas a la decisión del Directorio o la Asamblea, según la gravedad del caso."),',
    '("p", "Artículo 14°. Suspensión y pérdida de la calidad de socio/voluntario. Procederá por renuncia, fallecimiento, mora grave, incumplimiento ético o disciplinario, acciones que atenten contra la organización y sus objetivos, asumir roles no asignados o por acuerdo fundado de la Asamblea, garantizando debido proceso y derecho a defensa. El Comité de Ética podrá emitir informes o recomendaciones previas a la decisión del Directorio o la Asamblea, según la gravedad del caso."),'
)

# Fix Artículo 68 defense/defensa
content = content.replace(
    '("p", "El procedimiento disciplinario asegurará derecho a defensa, instancia de apelación y registro en acta."),',
    '("p", "El procedimiento disciplinario asegurará derecho a defensa, instancia de apelación y registro en acta."),'
)

with open("c:/PRUANED/generate_exact_html.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated generate_exact_html.py")
