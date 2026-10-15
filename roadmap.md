# Roadmap — NexoVital

## App móvil (src/routes/index.tsx)
- [x] Login fondo rojo, selector DNI/CE/Pasaporte, sin registro con Google
- [x] Registro: documento, nombres, correo, teléfono, grupo sanguíneo/Rh, contraseña, términos
- [x] Recuperar contraseña: teléfono/correo enmascarado → código 6 dígitos → reenviar → nueva contraseña
- [x] Donante: inicio con mapa y tarjeta de matching 1 min, seguimiento con línea de tiempo, cancelar proceso
- [x] Historial con pestañas Historial/Estadísticas (gráficos Hb, presión, pulso)
- [x] Solicitante: búsqueda por código con modal de confirmación, seguimiento por donante, historial
- [x] Menú lateral: notificaciones (3 interruptores), info, términos, privacidad, cancelar búsqueda

## Backoffice (src/routes/backoffice.tsx)
- [x] Login institucional con fondo rojo y recuperación de acceso
- [x] Admin: buscar establecimiento, activar/desactivar cuentas de personal y centros, registrar personal, CRUD de establecimientos
- [x] Hospital: tarjetas de panel, crear solicitud con código generado (modal), historial con filtros (código, estado, fecha) y detalle con donaciones
- [x] Proceso activo por etapas: identificación (código + DNI), tamizaje (Hb/presión/pulso), donación, validación final (resultado, aptitud, motivo, fechas) + historial del donante

## Pendiente
- [ ] Añadir compatibilidad y rango al carnet y adaptar el acceso hospitalario a la referencia de Brenda.
- [x] Reemplazar carnet de Cuenta con lectura del perfil y compartir/copiar; actualizar métricas de bienvenida y etapas del proceso (verificado en demo; la cuenta de prueba no tiene perfil disponible).
- [ ] Renovar la app móvil con un diseño distintivo y compacto
- [x] Proceso hospitalario editable y persistente, compartido entre personal del mismo hospital
- [x] Donación realizada/no realizada y resultados en historial
- [x] Vigencia de solicitudes de 24 horas y métricas por estado
- [x] Actividad reciente sin detalles y búsqueda administrativa de solo lectura
- [x] Profesionalizar la presentación del acceso, app móvil y backoffice sin alterar los flujos
- [x] Inicio del backoffice sin botones de acción y con tarjeta de presentación roja (rol hospital y administrador)
- [x] Rediseño minimalista del backoffice: barra lateral roja degradada, fondo cálido, tarjetas con acentos de color y chips de estado
- [ ] Verificar el mapa de Google en la URL de vista previa (falla en localhost por restricción de dominio de la clave)
- [ ] Conectar los flujos demo a la base de datos real (perfiles, solicitudes, donaciones)
