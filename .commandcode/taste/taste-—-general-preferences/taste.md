# Taste — General Preferences

- Prefiere comunicarse en español. Confidence: 0.95
- Propone soluciones concretas de diseño en vez de delegar la decisión al asistente (ej: sugirió el enfoque exacto del honeypot doble checkbox). Confidence: 0.85
- Prefiere honeypots creativos y juguetones sobre CAPTCHAs genéricos — ej: checkbox visible "Los gatos son geniales" + checkbox oculto como trampa para bots. Confidence: 0.9
- Prefiere que el honeypot use un checkbox oculto (no un campo de texto) para atrapar bots que marcan todo. Confidence: 0.85
- Prefiere copy en español y con tono informal/juguetón para elementos de la UI (ej: "Los gatos son geniales" como verificación anti-bot). Confidence: 0.85
- Quiere consistencia de dark mode en todos los elementos nativos del navegador (selects, dropdowns) — no tolera que un control se renderice en claro cuando el tema es oscuro. Confidence: 0.9
- Prefiere soluciones framework-native (ej: API routes de Waku) sobre dependencias de plataforma (ej: Netlify Functions) — quiere que el dev local funcione sin servicios externos. Confidence: 0.9
- Cuando algo no funciona, dirige al asistente a revisar proyectos existentes suyos como referencia en vez de buscar documentación genérica — ej: "Revise [otro proyecto] para ver cómo se maneja ahí el uso de endpoints" y aplicar esas correcciones en el proyecto actual. Confidence: 0.92
- Investiga y corrige por su cuenta antes de pedir ayuda, y al reportar un error incluye el stack trace completo y el contexto de lo que ya intentó (ej: renombró la carpeta a `_api` siguiendo la convención de Waku antes de reportar el error de ruta duplicada). Confidence: 0.7
- Prefiere consolidar la configuración de variables de entorno en un único `.env` y que los scripts de deploy las carguen desde ese archivo (en vez de repartirlas entre `.env` y `.env.local`). Confidence: 0.65
- Mantiene archivos de plan en `planes/` (markdown por proyecto) como checklist vivo de progreso, y los referencia para verificar estado — ej: "¿completado entonces planes\01-ai-code-reviewer.md?". Confidence: 0.8
- Cuando un plan se desvía de la implementación, prefiere documentar las desviaciones en el propio archivo del plan (en vez de dejar el plan obsoleto o cambiar la implementación para coincidir). Confidence: 0.75
