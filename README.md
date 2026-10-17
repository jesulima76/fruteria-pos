# Frutería POS — guía para principiantes

Esta carpeta contiene el frontend web y una función de Vercel que comunica la aplicación con Google Apps Script. Los productos, existencias y ventas se guardan en Google Sheets.

## Antes de comenzar
- Una cuenta Google.
- Una cuenta GitHub.
- Una cuenta Vercel.
- Una computadora con navegador. No necesitas instalar un editor para empezar; puedes usar el editor web de GitHub.

## Parte 1. Crear la base de datos
1. Entra en https://sheets.google.com y crea una hoja nueva llamada `Base de datos Frutería POS`.
2. En esa hoja abre **Extensiones → Apps Script**.
3. Borra el código de ejemplo y pega el contenido completo de `Code.gs`.
4. Guarda el proyecto y ponle el nombre `Backend Frutería POS`.
5. En el selector de funciones elige `setupFruteria` y pulsa **Ejecutar**.
6. Google solicitará permisos. Revisa la cuenta y concede los permisos necesarios.
7. Regresa a Sheets. Debes ver las pestañas `Productos`, `Ventas` y `DetalleVentas`. Edita la pestaña `Productos`: cambia nombres, categorías, unidades, precios y stock. No cambies los encabezados de la primera fila. `activo` debe ser `TRUE` para mostrar el producto.

## Parte 2. Publicar Apps Script como API
1. En Apps Script, pulsa **Implementar → Nueva implementación**.
2. Tipo de implementación: **Aplicación web**.
3. Ejecutar como: **Yo**.
4. Quién tiene acceso: **Cualquier persona** (si esta opción no está disponible, la cuenta/organización puede restringirlo).
5. Pulsa **Implementar**, autoriza si lo solicita y copia la URL que termina en `/exec`.
6. Guarda esa URL: la necesitarás en Vercel. No publiques la URL en redes. La aplicación inicial no incorpora autenticación, así que es una solución básica y no debe exponerse con datos sensibles.

## Parte 3. Subir los archivos a GitHub
1. Entra en https://github.com y crea un repositorio nuevo, por ejemplo `fruteria-pos`.
2. Sube todos los archivos de esta carpeta manteniendo la estructura:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `vercel.json`
   - carpeta `api` con `pos.js`
   - `Code.gs` (copia de respaldo; también está instalado en Apps Script)
3. El repositorio puede ser privado o público. No subas contraseñas ni datos reales de clientes.

## Parte 4. Desplegar en Vercel
1. Entra en https://vercel.com e inicia sesión con GitHub.
2. Pulsa **Add New → Project** y selecciona el repositorio `fruteria-pos`.
3. En la configuración del proyecto, usa los valores por defecto. No hace falta un comando de build.
4. Antes de desplegar, en **Environment Variables** agrega:
   - Name: `APPS_SCRIPT_URL`
   - Value: pega la URL `/exec` de Apps Script
   - Environment: Production (y Preview si quieres probar previews)
5. Pulsa **Deploy**. Cuando termine, abre el dominio generado.

## Parte 5. Probar el punto de venta
1. Comprueba que el indicador diga `Conectado`.
2. Agrega productos al carrito, elige método de pago y pulsa **Registrar venta**.
3. Verifica que la venta aparezca en `Ventas`, el detalle en `DetalleVentas` y que el stock disminuya en `Productos`.
4. Prueba una cantidad superior al stock: el sistema debe rechazar la venta.
5. Si cambiaste `APPS_SCRIPT_URL` después del despliegue, entra a Vercel → Settings → Environment Variables y vuelve a desplegar.

## Qué incluye este prototipo
- Catálogo con búsqueda, categoría y unidad visibles.
- Carrito y cálculo del total.
- Método de pago y cálculo básico de cambio.
- Registro de ventas y detalle por producto.
- Descuento de inventario validado en el servidor.
- Últimas ventas.

## Limitaciones y recomendaciones importantes
- Es un MVP educativo para una caja/usuario y volumen bajo. Google Sheets no es una base de datos transaccional de alto rendimiento.
- No incluye autenticación, cierre de caja, impresión de recibos, devoluciones, impuestos configurables, reportes avanzados ni gestión de proveedores.
- El frontend muestra importes en USD; puedes cambiar `currency:'USD'` en `app.js` a `VES` si necesitas bolívares. Define primero si los precios se manejarán en USD, VES o ambos.
- Para ventas por peso, el campo `cantidad` admite decimales; ingresa stock y cantidades en la unidad indicada (por ejemplo, kg).
- Como la aplicación no tiene inicio de sesión, cualquier persona que encuentre el sitio podría intentar registrar ventas. Antes de usarla con dinero real, agrega una capa de autorización, limita el acceso y prueba copias de seguridad.
- Si Google Workspace bloquea el acceso de “Cualquier persona”, usa una cuenta personal autorizada o una arquitectura con autenticación. No intentes eludir políticas de la organización.

## Solución de problemas
- **Falta una pestaña:** vuelve a Apps Script y ejecuta `setupFruteria`.
- **Error de conexión / no devuelve JSON:** confirma que `APPS_SCRIPT_URL` termine en `/exec`, que la implementación sea una aplicación web y que el acceso esté configurado correctamente.
- **Cambiaste Code.gs:** pulsa **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar** para actualizar la API.
- **No aparecen productos:** verifica que `activo` esté en TRUE, que los encabezados no hayan sido alterados y que los precios/stock sean numéricos.
