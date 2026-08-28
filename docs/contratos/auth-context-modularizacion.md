# Contrato: AuthContext modularizado

Fecha: 2026-08-18  
Responsable: BAC  
Consumidores: FON y todo componente que consume `useAuth`

## Compatibilidad

`AuthProvider` y `useAuth` conservan los mismos valores y métodos públicos.
La extracción a `authIdentity`, `authPermissions` y `lib/authData` es interna;
no exige cambios en los consumidores de la interfaz.

## Dominios extraídos

- `useContentDomain` concentra noticias, categorías, documentos, Storage y las
  comprobaciones RPC de publicación.
- `useFinanceDomain` concentra donaciones, egresos, categorías, cuentas,
  cobros, balances y configuración financiera.

`AuthContext` conserva la composición de estado y el contrato único de
`useAuth`; los componentes existentes continúan consumiendo los mismos métodos
y valores.

## Permisos

`useServerPermissions` resuelve los seis RPC de autorización y
`resolvePermissions` mantiene el fallback offline preexistente. Los controles
de FON deben continuar tratándolos como capacidades de presentación; Supabase
sigue siendo la fuente de autorización.

## Contenido y documentos

`useContentDomain` conserva los valores públicos `newsList`, `docCategories`
y `documentsList` y sus métodos asociados. La comprobación de los RPC de CMS,
las reglas de archivo y el enlace temporal de documentos de socios viven en el
hook; `AuthContext` sigue siendo el único punto público de acceso.

## Finanzas

`useFinanceDomain` conserva el contrato de donaciones, egresos, categorías,
cuentas públicas, cobros, balances y ajustes financieros. El provider sigue
exponiendo los mismos valores y setters públicos; el hook recibe sólo el
setter de socios necesario para propagar el ajuste de cuota mensual.

## Postulación de socios

`addPostulacion(postulacionData)` conserva su firma. Para el formulario
ampliado se acepta `formularioCompleto` (o `formulario_completo`), que se
persiste en `postulaciones.formulario_completo`. Sólo se escriben las columnas
confirmadas del esquema base: identidad, contacto indexable, profesión, fecha
de nacimiento, motivación, fecha y estado. No se deben enviar archivos `File`
en el JSONB; FON debe representar adjuntos mediante metadatos o URLs.
