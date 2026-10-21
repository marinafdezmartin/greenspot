# GreenSpot

Prototipo WebGIS independiente sobre proximidad a espacios verdes de Madrid. **FASE B.1: carga y simbología de un GeoJSON real de OpenStreetMap**, sin análisis espacial. No es una herramienta oficial del Ayuntamiento de Madrid. Se conservan el visor de Esri y la interfaz existente.

## Arrancar en VS Code

1. Abre la carpeta `greenspot` en VS Code.
2. Con Live Server instalado, pulsa con el botón derecho en `index.html` y elige **Open with Live Server**.
3. Usa la URL HTTP indicada por Live Server. No abras el HTML con `file://`: los módulos ES necesitan un servidor.
4. Sin configuración local verás «Mapa pendiente de configuración». La navegación, los enlaces, el menú móvil y el selector preparatorio de radio siguen disponibles.

No se necesita npm, Node ni compilación. Se usa HTML, CSS, JavaScript, Bootstrap **5.3.8** (CSS con integridad) y ArcGIS Maps SDK for JavaScript **5.1** (Map Components). La navegación se resuelve con JavaScript vanilla; no requiere el bundle de Bootstrap. Hace falta conexión a Internet para los CDN y el mapa base.

## Configurar el mapa en local

1. Copia `assets/js/config.example.js` a `assets/js/config.local.js`.
2. Edita `apiKey` solo en la copia local, en tu editor. No pegues la clave en el chat, README, pruebas ni capturas.
3. `basemapStyle` propone `arcgis/light-gray`. Comprueba que la clave autoriza ese estilo; cambia el identificador solo por un estilo autorizado.
4. En Esri concede únicamente el privilegio **Basemaps** necesario para el mapa base. No habilites geocodificación, rutas, análisis de red ni geoprocesamiento. Revisa los permisos y consumo de tu cuenta.
5. Restringe los referrers a los orígenes de Live Server, por ejemplo `http://localhost:5500` y `http://127.0.0.1:5500` (ajusta el puerto y el patrón admitido por Esri). Verifica que la URL real coincide con lo permitido. Configura vencimiento razonable y supervisión de uso.
6. Recarga y verifica mapa, zoom, desplazamiento, atribución y «Volver a Madrid». Una clave caducada, sin permisos o con restricciones incompatibles debe mostrar un aviso de error.

`config.local.js` está excluido mediante `.gitignore`. Compruébalo con `git check-ignore assets/js/config.local.js` antes de versionar. **Ignorar el archivo no oculta la clave del navegador**: sus usuarios pueden verla en las peticiones o en el código servido. Su protección depende de restricciones, vigencia y privilegios mínimos. Utiliza credenciales separadas para local y producción cuando corresponda.

No hay despliegue preparado ni autorizado. Para un futuro hosting estático habrá que acordar un mecanismo explícito de configuración pública restringida; un `.env` de frontend no vuelve secreta una clave. Consulta las [buenas prácticas de Esri](https://developers.arcgis.com/documentation/security-and-authentication/security-best-practices/).

## Organización y puntos de conexión

| Archivo | Responsabilidad |
| --- | --- |
| `index.html` | Secciones, anclas, controles etiquetados y estado pendiente inicial. |
| `assets/css/style.css` | Tokens, composición editorial con fotografías locales, responsive y movimiento reducido. |
| `assets/js/app.js` | Eventos DOM del menú, cierre con Escape, navegación activa y actualización del radio preparado. Importa e inicia el mapa. |
| `assets/js/map.js` | Importación local protegida con try/catch, carga diferida del CDN, componente arcgis-map, estados, límites de espera y restablecimiento de vista. |
| `assets/js/map-layers.js` | Importa clases con `$arcgis.import()`, define símbolos, renderer y popup, añade el GeoJSON al mapa existente y devuelve la capa. |
| `assets/js/config.example.js` | Contrato de configuración sin credenciales. |
| `assets/data/README.md` | Estado y requisitos para las futuras capas. |

Se conserva `assets/js/script.js`, vacío y sin referenciar, para respetar el archivo original. La maqueta y las instrucciones se conservan intactas.

El mapa comienza en **longitud −3.7038, latitud 40.4168, zoom 12**, como vista general del centro de Madrid. La configuración se lee antes de cargar Esri; sin clave no se solicita el SDK ni el mapa base. Se asigna un Map y un Basemap con estilo, manteniendo vista y controles en Map Components. Los estilos del SDK se cargan automáticamente desde su CDN 5.1.

`data-map-state` en `.viewer` expresa `loading`, `unconfigured`, `ready` o `error`. Los mensajes se actualizan con `textContent` y regiones de estado accesibles. El botón de vuelta se habilita tras `viewOnReady()` y `basemap.loadAll()`. Los errores se presentan sin registrar claves ni objetos de error que puedan incluir URLs con tokens.

El radio vive en los controles nativos; `app.js` solo refleja la elección en el panel. No se elige un punto ni se crea geometría. En B.1, `map.js` llama a `addGreenSpacesLayer(mapElement.map)` después de preparar la vista y los controles. La lógica espacial podrá separarse más adelante en `analysis.js`, previa autorización y validación de método métrico y resultados frente a ArcGIS Pro. Ese archivo no se crea en B.1.

## Carga y simbología del GeoJSON (B.1)

`assets/data/espacios_verdes_madrid.geojson` contiene 2.707 entidades Polygon/MultiPolygon. La procedencia declarada es OpenStreetMap, extracción mediante Geofabrik y preparación en ArcGIS Pro. Véase el [registro de datos](assets/data/README.md).

El módulo sigue el orden de los ejercicios de Esri:

1. Importa `SimpleFillSymbol`, `UniqueValueRenderer`, `GeoJSONLayer` y `PopupTemplate` desde el SDK 5.1 ya cargado, mediante `$arcgis.import()`.
2. Define tres `SimpleFillSymbol`: verde medio para `park`, verde oscuro para `forest` y salvia claro para `recreation_ground`, con opacidad parcial y contornos de 0,5 puntos.
3. Crea un `UniqueValueRenderer` cuyo `field` es `fclass`. Cada entrada de `uniqueValueInfos` asocia el valor exacto del dato con su símbolo y una etiqueta en español.
4. Crea la `GeoJSONLayer` con URL local relativa al módulo, renderer y popup. El popup muestra nombre y categoría; nombres vacíos, nulos o solo con espacios se presentan como «Espacio verde sin nombre». Se usa `textContent` para no interpretar HTML de los atributos.
5. Ejecuta `map.add()` sobre el mapa existente, espera `layer.load()` y devuelve la instancia. El ID estable `espacios-verdes-madrid` permite recuperarla con `map.findLayerById()`; llamadas repetidas reutilizan la misma capa y su carga del SDK.

`osm_id`, `name`, `fclass` y las geometrías se conservan para trabajo posterior. El archivo original no se modifica; no se utiliza `Shape_Area` ni `Shape_Length` para mediciones. No hay consultas espaciales, buffers, cálculos de superficies, selección de puntos ni estadísticas de proximidad.

`map.js` espera también `view.whenLayerView()` para anunciar «Capa disponible». Los errores de la capa se notifican en el panel existente sin retirar el mapa base ni deshabilitar sus controles. El error general del visor se reserva a la inicialización, el mapa base y errores fatales de vista. La atribución de los datos aparece junto al visor, en el pie y en `GeoJSONLayer.copyright`, conservando las atribuciones de Esri: [© OpenStreetMap contributors (ODbL)](https://www.openstreetmap.org/copyright).

## Funciones y límites

Disponibles: landing, anclas, menú móvil con teclado/Escape, enlaces a fuentes, selector preparatorio 500 m / 1 km y estados del visor. Con clave válida y acceso al CDN: mapa base real, capa GeoJSON categorizada, popup, zoom, desplazamiento y vuelta a Madrid.

Pendientes tras B.1: leyenda propia, selección de ubicación, buffers, consultas espaciales, resaltado, recuento y listado de proximidad. «Analizar» está deshabilitado y los resultados son pendientes. Se usa exclusivamente el GeoJSON entregado por la propietaria, sin descargar capas ni crear resultados ficticios. La proximidad prevista es **en línea recta**: no representa tiempos caminando, rutas, accesibilidad universal, cobertura demográfica ni accesibilidad por red peatonal. No se avanza a B.2 sin confirmación.

La maqueta original se conserva como referencia y nunca se publica dentro de la página. En la segunda iteración visual se sustituyen las composiciones botánicas por imágenes locales de `assets/img/gallery/`, con procedencia confirmada por la propietaria. El hero utiliza `madrid.jpg`; las tarjetas, `ciudadania.jpg`, `urbanismo.jpg` y `profesionales-gis.png`; el cierre, `madrid-verde.jpg`. La imagen GIS se identifica como ilustración generada con IA. Véanse dimensiones, licencia declarada y créditos pendientes en [el registro de imágenes](assets/img/gallery/README.md).

Esta iteración conserva la paleta, el titular, los CTA y el visor. Las tarjetas combinan fotografía y texto, la metodología separa los radios previstos de las notas explicativas, y el proceso se presenta como una línea temporal horizontal en escritorio y vertical en móvil. Los offsets de ancla dejan espacio bajo la cabecera; cualquier enlace interno cierra el menú móvil antes de navegar. `map.js`, la configuración de Esri y los datos GIS no se modifican.

## Comprobación manual

En Live Server revisa 360, 768, 1024 y 1440 px: ausencia de desbordamiento horizontal, orden de paneles, altura de mapa y atribución. Recorre con Tab los enlaces, menú, radios (flechas) y controles disponibles; comprueba Escape y el foco. Activa movimiento reducido para revisar los desplazamientos sin animación.

Sin archivo local debe aparecer el estado pendiente. La importación de un archivo local ausente puede producir un 404 en desarrollo; se captura y no impide ejecutar la interfaz. Con clave vacía tampoco se carga el SDK. Con clave válida comprueba la cartografía real; con permisos incorrectos o red interrumpida, el aviso de error. No compartas capturas de red ni consola con tokens.

## Verificación realizada

### Fase B.1

Se inspeccionó el GeoJSON local: 2.707 entidades poligonales, campos requeridos presentes y las tres categorías esperadas; su hash confirma que el original no se modificó. Se verificaron la carga real de la capa y su vista mediante el SDK 5.1, los tres símbolos, los campos conservados, los casos de popup con nombre nulo/vacío/espacios y la inserción segura de nombres como texto.

La prueba en Edge se hizo con un servidor HTTP local en `http://localhost:5500`, equivalente al origen habitual de Live Server, y la configuración local existente, sin imprimir credenciales. El mapa base y el GeoJSON cargaron sin fallos HTTP ni excepciones JavaScript en la carga normal. Zoom, desplazamiento y «Volver a Madrid» funcionaron. Dos llamadas adicionales al módulo reutilizaron la instancia: una sola capa operativa y una sola petición del GeoJSON durante esa carga de página.

Se revisó una captura del visor con los polígonos situados sobre Madrid y las atribuciones visibles. Una pulsación real sobre un polígono abrió el popup de la capa, con nombre y categoría correctos. Una segunda carga de prueba interceptó exclusivamente la petición local del GeoJSON y respondió con HTTP 404: se mostró el aviso de capa, se mantuvo una sola instancia de `arcgis-map` y el mapa base continuó operativo, incluido «Volver a Madrid». El original no se modificó para realizar esta prueba.

El origen de prueba inicial `127.0.0.1:8765` obtuvo HTTP 401 del mapa base; no se modificó la clave ni sus restricciones. `localhost:5500` funcionó. La prueba no se realizó con la extensión Live Server de VS Code, sino con un servidor HTTP local. Quedan pendientes la validación independiente de la preparación/exportación en ArcGIS Pro, la revisión de cobertura de los datos y las pruebas de análisis, fuera del alcance B.1.

### Entregas visuales anteriores

Verificación de esta entrega: HTML con etiquetas equilibradas, identificadores únicos, anclas y referencias ARIA correctas; recursos locales accesibles por HTTP; exclusión de configuración local verificada con Git. En Edge sin interfaz se probaron 360/768/1024/1440 px sin desbordamiento horizontal, cambio de radio con flechas de teclado, menú móvil con barra espaciadora, Escape, foco de navegación y movimiento reducido. No se observaron excepciones JavaScript. Se revisaron capturas de escritorio y móvil.

Segunda iteración visual: se repitieron las comprobaciones responsive e interacciones, se verificó la carga de las cinco imágenes locales y sus textos alternativos, y se comprobó que las anclas de mapa, metodología y proyecto dejan sus encabezados por debajo de la cabecera a los cuatro anchos. Los radios, menú, Escape y navegación por teclado siguen operativos. El HTML de la sección del visor se conservó exactamente; `map.js` y `config.example.js` conservan sus hashes previos. Las fotografías originales no se modificaron. Las comprobaciones no detectaron excepciones JavaScript ni desbordamientos horizontales.

Límites de la prueba: el navegador del entorno bloqueó el CDN de Bootstrap (`ERR_NETWORK_ACCESS_DENIED`); la estructura principal conserva su diseño con el CSS propio. No se verificó el aspecto con el CSS remoto cargado. No había configuración local: se comprobó el aviso de ausencia, pero no la cartografía real, sus controles, atribución ni los fallos de autenticación/SDK en ejecución. Esas pruebas quedan pendientes en Live Server con tu clave. La comprobación local usó un servidor HTTP equivalente, no la extensión de VS Code. No se enviaron archivos a validadores remotos.

## Referencias oficiales consultadas

- [Bootstrap 5.3: introducción y CDN 5.3.8](https://getbootstrap.com/docs/5.3/getting-started/introduction/).
- [Map Components y CDN 5.1](https://developers.arcgis.com/javascript/latest/references/map-components/).
- [Ejemplo oficial de mapa 2D](https://developers.arcgis.com/javascript/latest/sample-code/intro-map-components/).
- [Ciclo de vida y viewOnReady](https://developers.arcgis.com/javascript/latest/watch-for-changes/).
- [Autenticación y API keys](https://developers.arcgis.com/javascript/latest/authentication/access-tokens/).
- [Fuente y atribución de los datos actuales: OpenStreetMap](https://www.openstreetmap.org/copyright).
- [GeoJSONLayer](https://developers.arcgis.com/javascript/latest/references/core/layers/GeoJSONLayer/).
- [UniqueValueRenderer](https://developers.arcgis.com/javascript/latest/references/core/renderers/UniqueValueRenderer/).
- [SimpleFillSymbol](https://developers.arcgis.com/javascript/latest/references/core/symbols/SimpleFillSymbol/).
- [PopupTemplate](https://developers.arcgis.com/javascript/latest/references/core/PopupTemplate/).
