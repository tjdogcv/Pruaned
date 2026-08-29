const fs = require('fs');
const file = 'src/pages/intranet/SociosDirectory.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = \  const handleFileUploadFoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFotoPerfil(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUploadFirma = (cargoKey, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFirmaOficial(cargoKey, reader.result);
        alert(\\\¡Firma digitalizada de \ actualizada en certificados y documentos!\\\);
      };
      reader.readAsDataURL(file);
    }
  };\;

const replacement = \  const handleFileUploadFoto = async (e) => {
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
        alert(\\\¡Firma digitalizada de \ actualizada en certificados y documentos!\\\);
      } catch (err) {
        console.error('Error compressing signature', err);
        alert('Hubo un error al procesar la firma.');
      }
    }
  };\;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
