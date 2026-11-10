# Prueba local de chat

## Servicios

- Backend principal: `https://backendcopia-software.onrender.com` (`VITE_API_URL`).
- DrawSchemaAI: `https://iabackend-copia.onrender.com` (`VITE_AI_API_URL`).
- Socket del diagramador: `wss://backendcopia-software.onrender.com` (`VITE_WS_URL`).
- Ollama es un servicio interno de DrawSchemaAI. El navegador no llama directamente a Ollama ni a Neon.

La base de datos puede seguir alojada en Neon mientras las APIs se ejecutan localmente.
El backend debe tener activadas las tablas de chat y los endpoints nuevos.
La configuración BACKEND_API_URL de DrawSchemaAI debe apuntar a la raíz del backend, sin `/docs`.

## Comprobación manual

1. Reiniciar Vite si se cambió `.env` e iniciar sesión.
2. Abrir un proyecto/diagrama y enviar una consulta individual.
3. Recargar: el mensaje humano debe seguir en el historial.
4. Abrir la misma conversación grupal desde otra sesión con un miembro del mismo proyecto.
5. Enviar un mensaje: debe aparecer en la otra sesión en aproximadamente cinco segundos.
6. Verificar que la conversación individual de la otra cuenta no sea visible.
7. Cambiar de proyecto y regresar. No deben mezclarse los historiales.

## Alcance actual

Mensajes humanos persistentes, historial paginado y actualización periódica sin superponer consultas. No hay todavía WebSockets de chat.
El modo individual guarda consulta y respuesta. El backend llama a DrawSchemaAI y almacena el texto y el plan estructurado.
El modo grupal intercambia mensajes e invoca al asistente al mencionar @IA. Las respuestas se comparten y se conservan.
El análisis individual de imágenes guarda la consulta (nombre del archivo), el texto extraído, el plan y las advertencias. El archivo de imagen original no se almacena. Los adjuntos y el dictado grupales siguen deshabilitados.

## Producción

Configurar las tres variables del ejemplo con las URLs desplegadas, usar HTTPS/WSS y volver a compilar/desplegar el frontend. El backend debe permitir el origen del frontend en CORS. No introducir credenciales Neon ni claves internas en variables VITE_.
La conexión entre DrawSchemaAI desplegado y el modelo de la computadora requiere además el puente protegido y el túnel; cambiar VITE_AI_API_URL no resuelve ese enlace.

## Verificación automatizada

`node --test tests/chat.test.cjs`

Pruebas de contratos HTTP y cambios de estado con dependencias simuladas; no escriben en Neon.

## Respuestas persistentes

Reiniciar backend y DrawSchemaAI después de actualizar. Configurar AI_API_URL=https://iabackend-copia.onrender.com en el backend y BACKEND_API_URL= https://backendcopia-software.onrender.com en DrawSchemaAI. El frontend deja de pedir el planner directamente para texto: primero guarda el mensaje y pide su respuesta mediante el backend. Un reintento reutiliza el mensaje y una respuesta ya guardada. Los planes recuperados solo se muestran para su diagrama; se rechaza aplicarlos si su versión cambió.
