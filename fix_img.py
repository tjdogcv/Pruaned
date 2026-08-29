import sys

file_path = 'src/pages/intranet/SociosDirectory.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "const handleFileUploadFoto = (e) => {" in line:
        skip = True
        new_lines.append('''  const handleFileUploadFoto = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 400, 0.7);
        setEditFotoPerfil(compressedBase64);
      } catch (err) {
        console.error('Error compressing profile photo', err);
        alert('Hubo un error al procesar la imagen.');
      }
    }
  };

  const handleFileUploadFirma = async (cargoKey, e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 600, 0.8);
        updateFirmaOficial(cargoKey, compressedBase64);
        alert(¡Firma digitalizada de  actualizada en certificados y documentos!);
      } catch (err) {
        console.error('Error compressing signature', err);
        alert('Hubo un error al procesar la firma.');
      }
    }
  };
''')
    if skip and "const handleExportarDatosARCO = () => {" in line:
        skip = False
    
    if not skip:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print("done")
