# GreenSpot — instrucciones del repositorio para Codex y OpenCode

> Este archivo gobierna el trabajo en el proyecto `greenspot/`. Antes de editar, inspecciona el repositorio real y el material disponible. Si una instrucción contradice una petición posterior y explícita de la propietaria, pide aclaración cuando sea necesario.

## 1. Objetivo, usuarios y alcance

GreenSpot es un prototipo público de **WebGIS sobre proximidad espacial a parques y jardines de Madrid**, destinado al portfolio y a una demostración técnica (23/10/2026). Está dirigido a ciudadanía, estudiantes y profesionales de GIS, urbanismo y medioambiente. **No es una herramienta oficial del Ayuntamiento de Madrid.**

La web combina una landing editorial de una sola página con un **visor real de Esri integrado**. El mapa debe tener protagonismo visual, pero la página también debe explicar para qué sirve la herramienta, cómo se construye y qué limitaciones tiene.

Usa vocabulario geográfico preciso: la métrica de la primera versión GIS será **proximidad en línea recta**, mediante radios de 500 m y 1 km; no equivale a rutas, tiempos a pie, accesibilidad universal, cobertura demográfica ni accesibilidad real por red peatonal. Si un título usa «accesibilidad verde» en sentido divulgativo, aclara esta limitación junto a la metodología y en los resultados.

### Fases de trabajo: respetar su orden

**FASE A — ahora (sitio visual + mapa real):** construir una página web completa y responsive; integrar un mapa interactivo del ArcGIS Maps SDK for JavaScript centrado en Madrid; mostrar controles y panel de resultados preparados para conectar datos posteriormente. Deben funcionar la navegación, los CTA que dirigen a secciones y las interacciones independientes del GIS. Los análisis, recuentos y resultados se muestran como **pendientes**, nunca como simulaciones. Si falta la configuración de mapa, mostrar una explicación y la interfaz de respaldo sin fingir que el mapa funciona.

**FASE B — solo después de recibir los GeoJSON de la propietaria:** integrar las capas reales de parques/jardines desde `assets/data/`; permitir elegir punto, radio 500 m / 1 km y analizar con un buffer dinámico del SDK; identificar entidades según geometrías reales; resaltar, listar y contar los parques encontrados. Verificar campos reales y resultados con ArcGIS Pro. Los cálculos métricos deben usar operaciones/proyecciones adecuadas, no medidas sobre grados.

**FASE C — ampliaciones no autorizadas aún:** comparador de dos ubicaciones, fichas avanzadas, métricas agregadas o accesibilidad por red peatonal; no describirlas como funciones disponibles.

No adelantes implementaciones de B o C ni agregues capas de ejemplo o valores de muestra que parezcan resultados reales.

## 2. Stack y documentación verificada

- **HTML5 semántico + CSS3 + JavaScript vanilla** (módulos ES cuando ayuden a separar responsabilidades).
- **Bootstrap 5.3.8 estable**, por CDN y sin proceso de compilación. Bootstrap 6.0.0-alpha.1 es una versión preliminar y **no** debe usarse por defecto.
- **ArcGIS Maps SDK for JavaScript 5.1**, por CDN (`https://js.arcgis.com/5.1/`), con **Map Components** (`<arcgis-map>` y componentes necesarios). Usar documentación vigente y los métodos exactos de esa versión; preferir componentes actuales frente a widgets obsoletos.
- **VS Code + Live Server**, sin compilación, npm, Node, Vite ni bundler. No incorporar React, Next, Vue, Angular, Leaflet, backend o base de datos.
- Las bibliotecas necesarias pueden cargarse desde CDN oficial con versiones fijadas; no añadir paquetes por estética o conveniencia menor.

Documentación de referencia, comprobada en octubre de 2026:

- Bootstrap: https://getbootstrap.com/docs/5.3/getting-started/introduction/
- ArcGIS SDK (CDN): https://developers.arcgis.com/javascript/latest/get-api/
- Componentes de mapa: https://developers.arcgis.com/javascript/latest/references/map-components/
- Autenticación Esri: https://developers.arcgis.com/javascript/latest/authentication/access-tokens/
- Buenas prácticas de claves: https://developers.arcgis.com/documentation/security-and-authentication/security-best-practices/

Consulta la documentación concreta antes de fijar atributos, propiedades, importaciones o API GIS. Documenta los cambios de versión si fueran imprescindibles.

## 3. Estructura: conservar primero, ampliar lo mínimo

```text
greenspot/
├── AGENTS.md
├── .opencode/
│   └── agents/
│       └── greenspot-builder.md
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── img/
│   │   ├── templates/
│   │   │   └── greenspot_mockup.png
│   │   └── gallery/
│   ├── data/
│   │   └── README.md
│   └── js/
│       ├── app.js
│       ├── map.js
│       └── analysis.js          # Solo en FASE B, si hace falta
├── index.html
├── .gitignore
└── README.md
```

Este árbol es una **guía**, no una orden para crear archivos innecesarios. Inspecciona los nombres, tipos y carpetas reales antes de crear, modificar o mover nada. Conserva cualquier archivo existente y no sobrescribas datos ni fotografías originales.

| Ruta | Uso y regla |
| --- | --- |
| `index.html` | Estructura semántica de una sola página, metadatos y anclas de navegación. |
| `assets/css/style.css` | Tokens de diseño, componentes y responsive; sin estilos duplicados arbitrarios. |
| `assets/js/app.js` | Navegación, estado de componentes y UI que no requiere GIS. |
| `assets/js/map.js` | Carga/configuración del ArcGIS SDK, estados del visor, vista de Madrid y errores. |
| `assets/js/analysis.js` | Lógica GIS de FASE B **únicamente**, no crear ahora salvo justificación. |
| `assets/data/` | GeoJSON reales que entregará la propietaria; no descargar ni fabricar capas. README de procedencia/estado si resulta útil. |
| `assets/img/templates/greenspot_mockup.png` | **Referencia visual principal**. Inspecciónala, pero nunca la incrustes como hero, captura de mapa, «demo», fondo de la aplicación o resultado publicado. |
| `assets/img/gallery/` | Solo recursos visuales publicables cuyo origen y licencia puedan verificarse; si faltan, usa diseño CSS digno o placeholders transparentemente identificados. |
| `assets/img/profile/` | **No existe ni se necesita** en GreenSpot; no crear. |
| `.opencode/agents/greenspot-builder.md` | Instrucciones especializadas del agente OpenCode, subordinadas al alcance de este archivo. Codex debe leerlas explícitamente cuando se le indique. |

Si la imagen `greenspot_mockup.png` falta en la carpeta real, **avisa**; no asumas que un adjunto en otra conversación es visible desde VS Code.

## 4. Identidad visual basada en la maqueta

Inspiración: la segunda maqueta de GreenSpot, página larga editorial con jerarquía clara, combinación de fotografía y paneles limpios, muchos márgenes y **mapa como sección central**. Reproduce su carácter visual, **no** su imagen píxel a píxel ni sus cifras ilustrativas.

- Estilo contemporáneo, minimalista, espacial, premium y sobrio; evitar dashboard recargado, gradientes llamativos y estética infantil.
- Blancos y verdes muy pálidos, verde bosque, negro verdoso para texto, bordes suaves, esquinas moderadas, sombras discretas, retícula holgada, tipografía sans-serif legible y títulos de gran jerarquía.
- Propuesta de *tokens* en `:root` (ajustables tras inspeccionar la maqueta): `--color-primary: #244f36;`, `--color-primary-hover: #173b28;`, `--color-ink: #162621;`, `--color-muted: #60706a;`, `--color-bg: #ffffff;`, `--color-surface: #f3f7f2;`, `--color-border: #dce7dd;`. Usarlos de forma coherente, no añadir verdes arbitrarios en cada sección.
- Transiciones suaves de 150–250 ms cuando tengan utilidad, con soporte para `prefers-reduced-motion`.
- Dar **altura explícita** al componente de mapa y asegurar que controles, zoom, atribuciones y paneles son legibles sin solaparse.
- Diseño priorizado para escritorio durante la demostración y adaptado cuidadosamente a tablet/móvil.

## 5. Estructura de la landing de FASE A

1. Cabecera discreta con marca GreenSpot y anclas **Inicio**, **Mapa**, **Metodología** y **Proyecto**; menú móvil accesible.
2. Hero editorial con titular y descripción honestos, CTA **Explorar el mapa** y composición de contexto visual inspirada en la maqueta. Una fotografía solo si es publicable y está acreditada; en otro caso, alternativa original HTML/CSS.
3. Tres tarjetas informativas orientadas a **ciudadanía**, **urbanismo** y **profesionales GIS**, sin atribuir funciones aún no disponibles.
4. Sección principal **Explora la proximidad a zonas verdes** / **Análisis de accesibilidad**: **mapa ArcGIS de verdad** centrado en Madrid, panel de controles preparado y panel de resultados en estado pendiente. Incluir estados de inicialización, éxito, falta de configuración y fallo.
5. **Metodología, fuentes y limitaciones**: datos abiertos previstos del Ayuntamiento de Madrid, distancias en línea recta, análisis pendiente hasta FASE B.
6. Proceso **del dato al mapa**, distinguiendo preparación GIS, integración, análisis y comunicación de resultados como flujo metodológico previsto.
7. Cierre/CTA y pie con proyecto demostrativo, fuente de datos prevista, atribución de mapa/base y créditos de fotografía cuando proceda.

**No incluir** comparador de barrios con métricas ilustrativas, KPI de «3.800 zonas», «6,7 M de habitantes», «15 min a pie», hectáreas, porcentajes, supuestos nombres de parques cercanos, testimonios, distancias ni tiempos simulados. Esos elementos de la maqueta son solo referencias compositivas.

### Reglas de interacción

- Navegación y CTA de ancla reales; estados `hover` / `focus-visible` y funcionamiento mediante teclado.
- Mapa real con desplazamiento y zoom; si se añade restablecimiento de extensión, debe funcionar de verdad.
- Radios **500 m / 1 km** visibles como opciones preparatorias, pero **Analizar** deshabilitado o claramente indisponible hasta datos validados. Mostrar mensaje comprensible: «Análisis disponible tras incorporar los datos GIS».
- Listado, indicadores y leyenda de capas propias: estado vacío/pendiente, **sin** resultados ficticios. No crear mapas falsos en CSS o capturas para sustituir el visor.
- La posible búsqueda de direcciones se pospone salvo confirmación expresa de privilegios/coste; nunca ofrecer un campo que parezca operativo si no lo está.

## 6. Arquitectura del mapa y API key

- Usar el SDK **5.1** con Map Components y CDN. Centrar vista inicial en **Madrid**; documentar centro y zoom elegidos. Configurar basemap de Esri que la API key realmente autorice.
- Proponer un archivo local `assets/js/config.local.js` **ignorado por Git** y un `assets/js/config.example.js` sin token. Si el archivo local no existe, controlar su ausencia de manera segura (p. ej., importación dinámica con `try/catch`) y mostrar **«Mapa pendiente de configuración»**; el resto de la landing debe seguir visible y usable.
- No introducir la clave en el prompt, conversación, README, logs, capturas, pruebas, `.gitignore`, `config.example.js` ni commits. No pedir credenciales de propietario o acceso privado.
- **Una API key utilizada en el navegador es visible a sus usuarios** aunque venga de un archivo ignorado por Git o de variables de entorno inyectadas en frontend. Protegerla con privilegios mínimos, vencimiento razonable, restricciones de `referrer` para `localhost` y futuro dominio público, y supervisión de uso. Recomendar credenciales separadas para local/producción cuando sea conveniente.
- Mostrar estado de error entendible si SDK/basemap falla o la key no tiene permisos. No registrar en consola URLs con tokens ni valores secretos. Evitar servicios de rutas, áreas de servicio, geocodificación o procesamiento de pago adicionales.
- Para Vercel **no** fingir que `.env` oculta tokens en una aplicación estática: documentar posteriormente un mecanismo explícito de configuración pública restringida, pendiente de autorización. **No desplegar ahora**.

## 7. Datos y GIS: solo preparativos en FASE A

Fuente **prevista** (no descargada ni verificada aún): https://datos.madrid.es/. Las capas vendrán de ArcGIS Pro, limpiadas y exportadas a GeoJSON WGS84/EPSG:4326. Hasta conocer datos reales no asumir campos, entidades, geometrías, licencias, cobertura territorial ni número de registros. Los cálculos posteriores en metros exigirán un método geométrico/espacial adecuado y verificación frente a ArcGIS Pro.

En la web distinguir «datos previstos» frente a «datos ya integrados». Documentar qué funciones faltan para que la primera entrega no se presente como herramienta de análisis terminada.

## 8. Accesibilidad, calidad y contenido

- `lang="es"`, HTML semántico, un solo `h1`, jerarquía de títulos consistente, etiquetas asociadas, textos alternativos informativos, contraste legible y foco visible.
- Enlaces con destino real; botones operativos o deshabilitados con explicación. No usar `href="#"` para simular acciones. No presentar textos de relleno como información factual.
- CSS mobile-first o estrategia coherente; comprobar al menos 360, 768, 1024 y 1440 px, sin desbordamiento horizontal, respetando el área de mapa.
- Estados de carga/error anunciados accesiblemente (`role="status"` o equivalente apropiado), navegación con teclado y control de movimiento reducido.
- Metadata: título, descripción, viewport; añadir enlaces a fuentes/atribuciones verificadas. Sin afirmaciones oficiales ni SEO basado en resultados inexistentes.
- Código pequeño y legible: nombres descriptivos en inglés o español de forma consistente, funciones con una responsabilidad, comentarios únicamente donde expliquen decisiones no obvias. Evitar duplicidades y abstraer solo cuando sea útil.
- Validar HTML, rutas, anclas, recursos, consola y red; comprobar carga real del mapa en Live Server **solo si hay clave local disponible**. Informar qué pruebas no se realizaron; no afirmar pruebas completas si no se pudieron ejecutar.

## 9. Procedimiento de trabajo y límites

1. Inspeccionar archivos/carpeta y maqueta real; resumir incidencias relevantes.
2. Implementar FASE A **de principio a fin**, no quedarse únicamente en un plan o maqueta.
3. Probar, corregir fallos razonables y revisar responsive/accesibilidad.
4. Entregar resumen breve de archivos modificados, funcionalidad real, pendientes GIS y cómo arrancar con Live Server. Explicar brevemente arquitectura y puntos de conexión futuros para facilitar aprendizaje.

**Prohibido sin autorización expresa:** `git commit`, `git push`, publicación, despliegue, envío de archivos a servicios externos/validadores remotos, borrar o sobrescribir archivos de la propietaria, alterar datos GIS, descargar capas por iniciativa propia o introducir servicios con coste. Consultar antes de acciones destructivas o cambios grandes de arquitectura.
