# Plan de NexoVital

## Objetivo
Construir un prototipo funcional conectado de NexoVital con dos experiencias: una app móvil para donantes y solicitantes, y un backoffice para administradores y personal hospitalario.

## App móvil
- Crear acceso, registro con perfil completo y recuperación de contraseña por pasos.
- Incorporar cambio de modo entre Donante y Solicitante desde la cuenta.
- Donante: mapa interactivo a pantalla completa, ubicación actual, centros cercanos, solicitudes compatibles, respuesta con contador y disponibilidad estimada.
- Solicitante: mapa interactivo a pantalla completa, ingreso de código, búsqueda de donantes y seguimiento individual anónimo.
- Crear tracking de donación, cancelaciones condicionadas, historial, elegibilidad, estadísticas, perfil y preferencias de notificaciones.
- Mantener navegación móvil inferior y paneles superpuestos compactos para que el mapa siga siendo el elemento principal.

## Backoffice
- Crear un acceso único que muestre herramientas según el rol: Administrador o Personal hospitalario.
- Administrador: búsqueda por establecimiento, gestión de cuentas, registro de personal y gestión de establecimientos.
- Personal hospitalario: panel principal, creación e historial de solicitudes, detalle de unidades y donaciones, y registro del proceso activo.
- Incluir tamizaje, signos vitales, resultado final y aptitud del donante.
- Restringir la información operativa del personal al establecimiento que tiene asignado.

## Datos y seguridad
- Activar Lovable Cloud para cuentas, perfiles completos, establecimientos, solicitudes, matching, donaciones, seguimiento y notificaciones.
- Guardar roles en una estructura separada de los perfiles y validar permisos en el servidor.
- Aplicar aislamiento de datos por establecimiento y acceso mínimo a información sensible.
- Validar formularios tanto en pantalla como en el servidor.

## Mapas
- Conectar Google Maps Platform.
- Usar mapas interactivos de borde a borde en las pantallas principales de Donante y Solicitante.
- Mostrar ubicación, hospitales, bancos de sangre y unidades móviles con marcadores propios.
- Mantener tarjetas, alertas y controles flotantes legibles sin reducir el mapa a una tarjeta.
- Limitar, reutilizar y almacenar temporalmente búsquedas de lugares para controlar consumo.

## Diseño
- Aplicar una identidad minimalista, moderna y juvenil con fondos claros, colores vibrantes y saturados, tipografía sencilla y formas redondeadas.
- Definir un sistema visual semántico compartido para móvil y backoffice, adaptando densidad y navegación a cada entorno.
- Añadir transiciones breves y estados claros de éxito, alerta, urgencia y progreso.

## Entrega y validación
- Incluir datos demostrativos coherentes para recorrer los flujos principales.
- Verificar visualmente app móvil y backoffice en tamaños de pantalla adecuados.
- Probar acceso por rol, formularios, cambio de modo, matching, tracking, cancelaciones y aislamiento por establecimiento.
