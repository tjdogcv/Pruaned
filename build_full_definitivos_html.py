import pymupdf
import re

doc = pymupdf.open(r'C:\Users\crist\Downloads\Estatutos PRUANED definitivos.pdf')

content_blocks = []
stop_reading = False

for page_idx in range(2, len(doc)): # Page 3 is index 2
    if stop_reading:
        break
    pnum = page_idx + 1
    page = doc[page_idx]
    blocks = page.get_text("blocks")
    
    for b in blocks:
        text = b[4].strip()
        if not text:
            continue
        
        # Stop completely when reaching FIRMAS section
        if "FIRMAS" in text or "En constancia, firman los integrantes" in text or "Testigo 1" in text:
            stop_reading = True
            break
        
        # Remove running headers
        clean_header = text.replace("“", "").replace("”", "").replace('"', '').strip()
        if clean_header == "Por la inclusión de los animales en la gestión del riesgo de desastres":
            continue
        
        # Remove standalone page numbers at top/bottom of pages
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        if len(lines) == 1 and lines[0].isdigit() and int(lines[0]) == pnum:
            continue
            
        content_blocks.append((pnum, text))

print(f"Extracted {len(content_blocks)} clean content blocks for body.")

# Now construct HTML
html_parts = []

html_parts.append("""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Estatutos y Reglamento General de Funcionamiento - PRUANED A.G</title>

  <!-- Google Fonts: Outfit for Display/Headings, Inter for Body Text -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@500;600;700;800;900&display=swap" rel="stylesheet">

  <style>
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
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
      line-height: 1.55;
    }

    h1, h2, h3, h4, h5, h6, .font-heading {
      font-family: 'Outfit', sans-serif;
      color: #0C2340;
    }

    p {
      margin-top: 0;
      margin-bottom: 0.65rem;
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
      margin-bottom: 8mm;
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
      font-size: 17pt;
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
      font-size: 15.5pt;
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
      width: 220px;
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
      font-size: 12.5pt;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.8px;
    }

    .cover-year {
      font-family: 'Outfit', sans-serif;
      font-size: 15pt;
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
      margin-bottom: 11px;
      font-size: 9.2pt;
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
      font-size: 8.8pt;
    }

    .chapter-block {
      margin-top: 18px;
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
      font-size: 9.8pt;
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
      margin-bottom: 10px;
      padding: 1px 0;
      break-inside: avoid-page;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-header-stripe"></div>
    <div class="cover-top-motto">“Por la inclusión de los animales en la gestión del riesgo de desastres”</div>
    
    <div>
      <h1 class="cover-title">ASOCIACIÓN GREMIAL DE PROFESIONALES UNIDOS POR LOS ANIMALES EN EMERGENCIAS Y DESASTRES</h1>
      <div class="cover-subtitle-sigla">(PRUANED A.G)</div>
    </div>

    <div class="cover-logo-container">
      <img src="pruaned-logo-official.png" alt="PRUANED Logo Oficial">
    </div>

    <div>
      <div class="cover-doc-name-badge">
        <h2>ESTATUTOS Y REGLAMENTO GENERAL DE FUNCIONAMIENTO</h2>
      </div>
      <div class="cover-year">2025</div>
    </div>

    <div class="cover-footer-page-num">1</div>
  </div>

  <div class="page-break"></div>

  <!-- ÍNDICE -->
  <div class="index-container">
    <div class="section-header-banner">
      <h2>ÍNDICE</h2>
    </div>

    <ul class="index-list">
      <li class="index-item"><span class="chapter-label">ÍNDICE</span><span class="dots-leader"></span><span class="page-num">2</span></li>
      <li class="index-item"><span class="chapter-label">CAPÍTULO I: DENOMINACIÓN, NATURALEZA, DOMICILIO Y DURACIÓN</span><span class="dots-leader"></span><span class="page-num">3</span></li>
      <li class="index-item"><span class="chapter-label">CAPÍTULO II: OBJETO, FINES Y PRINCIPIOS</span><span class="dots-leader"></span><span class="page-num">3</span></li>
      <li class="index-item"><span class="chapter-label">CAPÍTULO III: DE LOS SOCIOS Y VOLUNTARIOS</span><span class="dots-leader"></span><span class="page-num">4</span></li>
      <li class="index-item"><span class="chapter-label">CAPÍTULO IV: ÓRGANOS DE LA ASOCIACIÓN</span><span class="dots-leader"></span><span class="page-num">5</span></li>
      <li class="index-item"><span class="chapter-label">CAPÍTULO V: DE LA ASAMBLEA GENERAL</span><span class="dots-leader"></span><span class="page-num">5</span></li>
      <li class="index-item"><span class="chapter-label">CAPÍTULO VI: DEL DIRECTORIO NACIONAL</span><span class="dots-leader"></span><span class="page-num">6</span></li>
      <li class="index-item"><span class="chapter-label">CAPÍTULO VII: DE LAS DIRECCIONES TÉCNICAS Y TEMÁTICAS</span><span class="dots-leader"></span><span class="page-num">7</span></li>
      <li class="index-item"><span class="chapter-label">CAPÍTULO VIII: RÉGIMEN ECONÓMICO, TRANSPARENCIA Y DONACIONES</span><span class="dots-leader"></span><span class="page-num">9</span></li>
      <li class="index-item"><span class="chapter-label">CAPÍTULO IX: COMISIÓN REVISORA DE CUENTAS</span><span class="dots-leader"></span><span class="page-num">10</span></li>
      <li class="index-item"><span class="chapter-label">CAPÍTULO X: RÉGIMEN ELECTORAL, REFORMAS Y DISOLUCIÓN</span><span class="dots-leader"></span><span class="page-num">11</span></li>
      <li class="index-item"><span class="chapter-label">CAPÍTULO XI: REGLAMENTO DEL VOLUNTARIADO</span><span class="dots-leader"></span><span class="page-num">12</span></li>
      <li class="index-item"><span class="chapter-label">ANEXO TÉCNICO: ESTRUCTURA JERÁRQUICA Y COORDINACIÓN INTERINSTITUCIONAL</span><span class="dots-leader"></span><span class="page-num">14</span></li>
    </ul>
  </div>

  <div class="page-break"></div>
""")

for pnum, text in content_blocks:
    if text.startswith("CAPÍTULO") or text.startswith("ANEXO TÉCNICO"):
        html_parts.append(f"""  <div class="chapter-block">
    <div class="chapter-banner">{text}</div>
  </div>
""")
    elif text in ["DEL FUNCIONAMIENTO DE LA ASOCIACIÓN", "Régimen extraordinario para emergencias y desastres"]:
        html_parts.append(f"""  <div class="chapter-block">
    <div class="chapter-banner-sub">{text}</div>
  </div>
""")
    else:
        m = re.match(r'^(Artículo\s+[0-9º\.\s\w\(\)]+?\.\s*)(.*)', text, re.DOTALL)
        if m:
            art_num = m.group(1).strip()
            art_rest = m.group(2).strip()
            formatted_rest = art_rest.replace("\n", "<br>")
            html_parts.append(f"""  <div class="article-box">
    <p><strong>{art_num}</strong> {formatted_rest}</p>
  </div>
""")
        else:
            formatted_text = text.replace("\n", "<br>")
            html_parts.append(f"""  <div class="article-box">
    <p>{formatted_text}</p>
  </div>
""")

html_parts.append("""</body>
</html>
""")

full_html = "".join(html_parts)

with open("c:/PRUANED/public/estatutos_redisenados.html", "w", encoding="utf-8") as f:
    f.write(full_html)

print("Regenerated clean definitivos HTML stopping exactly before FIRMAS.")
