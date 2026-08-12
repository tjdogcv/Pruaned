import fitz  # PyMuPDF
import os

pdf_path = "c:/PRUANED/public/Estatutos_PRUANED_AG_Redisenados.pdf"
output_dir = "c:/PRUANED/public/pdf_preview_pages"
os.makedirs(output_dir, exist_ok=True)

doc = fitz.open(pdf_path)
print(f"Total pages generated: {len(doc)}")

for idx, page in enumerate(doc):
    pix = page.get_pixmap(dpi=150)
    output_path = os.path.join(output_dir, f"page_{idx + 1}.png")
    pix.save(output_path)
    print(f"Saved page {idx + 1} to {output_path}")

doc.close()
print("All pages saved successfully!")
