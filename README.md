# GreenSpot

Prototipo WebGIS independiente sobre proximidad a espacios verdes de Madrid. **FASE B.4A: encuadre del buffer y resumen de resultados**, sobre la consulta espacial y los buffers geodésicos de 500 y 1.000 metros existentes. Muestra el total de entidades poligonales intersectadas, su recuento por categoría y hasta diez entidades con nombre; no representa parques independientes. No es una herramienta oficial del Ayuntamiento de Madrid. Se conservan el visor de Esri y el diseño general.

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
| `assets/js/gis-analysis.js` | Gestiona selección, buffer geodésico, gráficos, encuadre y consulta espacial con resumen de resultados. |
| `assets/js/config.example.js` | Contrato de configuración sin credenciales. |
| `assets/data/README.md` | Estado y requisitos para las futuras capas. |

Se conserva `assets/js/script.js`, vacío y sin referenciar, para respetar el archivo original. La maqueta y las instrucciones se conservan intactas.

El mapa comienza en **longitud −3.7038, latitud 40.4168, zoom 12**, como vista general del centro de Madrid. La configuración se lee antes de cargar Esri; sin clave no se solicita el SDK ni el mapa base. Se asigna un Map y un Basemap con estilo, manteniendo vista y controles en Map Components. Los estilos del SDK se cargan automáticamente desde su CDN 5.1.

`data-map-state` en `.viewer` expresa `loading`, `unconfigured`, `ready` o `error`. Los mensajes se actualizan con `textContent` y regiones de estado accesibles. El botón de vuelta se habilita tras `viewOnReady()` y `basemap.loadAll()`. Los errores se presentan sin registrar claves ni objetos de error que puedan incluir URLs con tokens.

El radio vive en los controles nativos; `app.js` refleja la elección en el panel y `gis-analysis.js` actualiza el buffer. `map.js` conserva la carga de B.1 con `addGreenSpacesLayer(mapElement.map)` y pasa esa instancia a `initializeGisAnalysis(mapElement, greenSpacesLayer)`, con su propio manejo de errores. Si la capa no se prepara, pasa `null`: siguen disponibles el mapa y los buffers, pero no la consulta. No se crea otro mapa ni se duplica el SDK. La lógica nueva se concentra en `gis-analysis.js`; no se añade otro archivo `analysis.js`.

## Cómo estudiar el código

El recorrido de la aplicación es `app.js → map.js → map-layers.js → gis-analysis.js`. No existe `main.js`: `app.js` ya inicia la aplicación y gestiona navegación, menú móvil y texto del radio. `script.js` está vacío y se conserva sin usar. `config.example.js` sigue siendo una plantilla sencilla; la configuración privada no se modifica.

- En `map.js`, lee primero `initializeMap()`: configura Esri, crea el componente, espera la vista, conecta el botón de restablecimiento y llama a los otros dos módulos. `setMapState()` reúne los cambios de la interfaz. Se sustituyeron las esperas genéricas con `Promise.race()` por un único temporizador de inicialización de 30 segundos, que se cancela cuando el mapa está preparado. `mapStarted` evita iniciar otro visor en la misma página.
- En `map-layers.js`, sigue los comentarios numerados: importaciones, símbolos, renderer, capa, popup y `map.add()`. `createPopupContent()` solo construye el contenido de la ficha. Se usan nodos de texto para no interpretar como HTML los nombres de OpenStreetMap.
- En `gis-analysis.js`, sigue `setSelectionMode() → handleMapClick() → updateBuffer()`. El estado necesario es el punto elegido, si se está seleccionando y los valores de popup/cursor que hay que restaurar. `cancelSelection()` reúne la cancelación del botón y de Escape. Las condiciones se escriben con `if / else`, sin ternarios anidados.

Las comprobaciones del buffer se apoyan en el contrato del SDK: tras esperar `load()`, `execute()` devuelve un `Polygon` o un valor vacío. Se comprueba ese resultado, sin volver a validar su tipo, anillos y extensión en cada cambio. Los dos radios proceden de los controles existentes. Se conserva `try / catch` para mostrar un aviso si falla el operador.

Se mantienen por necesidad técnica la carga asíncrona, el identificador estable de cada capa, la restauración de popups, `destroy()` para retirar eventos y gráficos, y `reactiveUtils.watch()` para detectar un fallo fatal de la vista. `IntersectionObserver` conserva el enlace activo de navegación. Los errores del GeoJSON y del operador se gestionan por separado para que no inutilicen el mapa base. No se modifican el algoritmo geodésico, las unidades, los símbolos ni el diseño.

## Carga y simbología del GeoJSON (B.1)

`assets/data/espacios_verdes_madrid.geojson` contiene 2.707 entidades Polygon/MultiPolygon. La procedencia declarada es OpenStreetMap, extracción mediante Geofabrik y preparación en ArcGIS Pro. Véase el [registro de datos](assets/data/README.md).

El módulo sigue el orden de los ejercicios de Esri:

1. Importa `SimpleFillSymbol`, `UniqueValueRenderer`, `GeoJSONLayer` y `PopupTemplate` desde el SDK 5.1 ya cargado, mediante `$arcgis.import()`.
2. Define tres `SimpleFillSymbol`: verde medio para `park`, verde oscuro para `forest` y salvia claro para `recreation_ground`, con opacidad parcial y contornos de 0,5 puntos.
3. Crea un `UniqueValueRenderer` cuyo `field` es `fclass`. Cada entrada de `uniqueValueInfos` asocia el valor exacto del dato con su símbolo y una etiqueta en español.
4. Crea la `GeoJSONLayer` con URL local relativa al módulo y renderer.
5. Configura su `PopupTemplate` mediante `createPopupContent()`. El popup muestra nombre y categoría; nombres vacíos, nulos o solo con espacios se presentan como «Espacio verde sin nombre». Se usa `textContent` para no interpretar HTML de los atributos.
6. Ejecuta `map.add()` sobre el mapa existente, espera `layer.load()` y devuelve la instancia. El ID estable `espacios-verdes-madrid` permite recuperarla con `map.findLayerById()`; llamadas repetidas reutilizan la misma capa y su carga del SDK.

`osm_id`, `name`, `fclass` y las geometrías se conservan para trabajo posterior. El archivo original no se modifica; no se utiliza `Shape_Area` ni `Shape_Length` para mediciones. El módulo de capas no incorpora consultas espaciales ni cálculos; los buffers de B.2 viven en un módulo independiente.

`map.js` espera también `view.whenLayerView()` para anunciar «Capa disponible». Los errores de la capa se notifican en el panel existente sin retirar el mapa base ni deshabilitar sus controles. El error general del visor se reserva a la inicialización, el mapa base y errores fatales de vista. La atribución de los datos aparece junto al visor, en el pie y en `GeoJSONLayer.copyright`, conservando las atribuciones de Esri: [© OpenStreetMap contributors (ODbL)](https://www.openstreetmap.org/copyright).

## Funciones y límites

### Selección y buffer geodésico (B.2)

1. Pulsa **Seleccionar ubicación** en el panel. Se activa un cursor de selección y se suspende temporalmente la apertura automática de popups. Puedes cancelar con el mismo botón o con Escape; se conservan los gráficos anteriores.
2. Pulsa sobre el mapa. Un único controlador `view.on("click", ...)` recibe `event.mapPoint`, la geometría `Point` con su referencia espacial. Se clona y guarda en `selectedPoint`. Fuera del modo de selección ese controlador no modifica la ubicación y los popups siguen funcionando.
3. Tras importar el operador mediante `$arcgis.import()`, se comprueba `isLoaded()` y, cuando hace falta, se espera `load()`. Solo entonces se habilita la selección. La geometría se crea con `geodesicBufferOperator.execute(selectedPoint, radius, { unit: "meters" })`. El radio solo admite 500 o 1.000; no se miden grados ni se interpreta la anchura proyectada del mapa como una distancia geodésica.
4. Se comprueba que el operador devuelva una geometría. Se crean dos `Graphic`: marcador azul y polígono azul semitransparente. La única `GraphicsLayer`, con ID `analysis-graphics`, dibuja el buffer debajo del marcador y encima de la capa verde. Los gráficos no tienen popup propio.
5. El evento `change` de los radios llama a `updateBuffer()` sobre el mismo `selectedPoint`. Una nueva ubicación reemplaza ese punto. Antes de dibujar se retiran los gráficos anteriores: siempre hay como máximo un marcador y un buffer. Si falla el cálculo, queda el marcador y un aviso, sin conservar un buffer con radio incorrecto.

Los eventos y la capa se crean una vez por inicialización. `destroy()` elimina controladores, retira la capa y restaura los popups si el visor sufre un fallo fatal. El botón **Volver a Madrid** conserva su función de navegación; no borra la ubicación elegida. El cambio de radio no mueve el mapa.

Disponibles: landing, anclas, menú móvil con teclado/Escape, enlaces a fuentes y estados del visor. Con clave válida y acceso al CDN: mapa base real, capa GeoJSON categorizada, popup, selección explícita de ubicación, radios 500 m / 1 km, buffer geodésico, zoom, desplazamiento y vuelta a Madrid.

### Consulta espacial con Query (B.3)

`updateBuffer()` guarda la geometría válida en `currentBuffer`. Al cambiar el punto o el radio, elimina el resultado anterior y habilita el botón solo si hay buffer y capa disponible. No consulta automáticamente.

El clic en **Analizar zona** llama a `analyzeZone()`, siguiendo el mismo procedimiento que los ejercicios del MásterGIS:

```js
const query = greenSpacesLayer.createQuery();
query.geometry = currentBuffer;
query.spatialRelationship = "intersects";
query.outFields = ["*"];
query.returnGeometry = true;

const resultado = await greenSpacesLayer.queryFeatures(query);
const espaciosEncontrados = resultado.features;
```

`createQuery()` ya devuelve un objeto `Query`; no requiere importar ni construir otro. `queryFeatures()` consulta los datos de la `GeoJSONLayer` existente y devuelve un `FeatureSet`. Su propiedad `features` contiene las entidades coincidentes, con atributos y geometría. El recuento usa `espaciosEncontrados.length`, incluido el cero, y se muestra con `textContent` en el panel existente. No se limita a los polígonos visibles del mapa ni se vuelve a descargar el GeoJSON.

Mientras espera, el botón queda deshabilitado y el mensaje anuncia la consulta. `queryVersion` es un contador: se incrementa con cada consulta o invalidación. Al recibir una respuesta se compara con el número guardado al empezar; si ya cambió, se ignoran tanto el resultado como los cambios del botón. Esto evita mostrar una respuesta antigua sobre un buffer nuevo. `destroy()` también invalida respuestas pendientes y retira el evento del botón. Un fallo de consulta muestra un aviso y permite reintentar sin retirar el visor.

Referencia: [GeoJSONLayer.createQuery() y queryFeatures(), documentación de Esri](https://developers.arcgis.com/javascript/latest/references/core/layers/GeoJSONLayer/).

### Encuadre y panel de resultados (B.4A)

Solo al pulsar **Analizar zona**, antes de la Query, se ejecuta:

```js
await view.goTo(currentBuffer.extent.clone().expand(1.3), {
  animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
});
```

`extent` es el rectángulo que contiene el buffer; `clone()` crea una copia y `expand(1.3)` amplía esa copia un 30 % alrededor del centro. Se añade margen al encuadre sin alterar la geometría consultada. `goTo()` ajusta la vista al rectángulo. Se conserva el movimiento reducido y se captura `AbortError`, una interrupción normal por navegación o restablecimiento, para continuar la consulta sin mostrar un error. Otros fallos de encuadre tampoco bloquean la Query. Tras esperar el zoom, `queryVersion` impide consultar un punto/radio que haya cambiado durante la navegación. Referencias de Esri: [MapView.goTo()](https://developers.arcgis.com/javascript/latest/references/core/views/MapView/#goTo), [Extent.expand()](https://developers.arcgis.com/javascript/latest/references/core/geometry/Extent/#expand).

La Query de B.3 se mantiene. `showResults(espaciosEncontrados)` recorre sus entidades con `for...of` y cuenta los tres valores de `fclass` mediante `if / else`. El total siempre es la longitud del resultado completo. Las categorías inesperadas se cuentan en una fila adicional «Sin clasificar», visible solo cuando sea necesaria.

En el mismo bucle se lee `(attributes.name || "").trim()`: los nombres vacíos, nulos o solo con espacios no entran en el listado, pero sus entidades permanecen en los recuentos. Se conservan el orden de la consulta y los nombres reales; `slice(0, 10)` limita el listado. No se agrupan nombres repetidos porque son entidades poligonales distintas. Si ninguna tiene nombre, se muestra una explicación. Los elementos se crean mediante `document.createElement()` y `textContent`, sin interpretar HTML de los atributos.

`clearResults()` limpia todos los indicadores y el listado al invalidar o comenzar una consulta. Se mantienen los estados sin analizar, consultando, consulta realizada, consulta sin resultados y error. La lista tiene altura máxima y desplazamiento con teclado para conservar el panel compacto; se mantienen la retícula y los puntos de adaptación existentes.

Pendientes tras B.4A: leyenda propia, resaltado y contraste independiente de resultados en ArcGIS Pro. No se calculan superficies, porcentajes, uniones ni índices. Se usa exclusivamente el GeoJSON entregado por la propietaria, sin descargar capas ni crear datos simulados. La proximidad es **en línea recta**: no representa tiempos caminando, rutas, accesibilidad universal, cobertura demográfica ni accesibilidad por red peatonal. No se avanza a otra fase sin confirmación.

La maqueta original se conserva como referencia y nunca se publica dentro de la página. En la segunda iteración visual se sustituyen las composiciones botánicas por imágenes locales de `assets/img/gallery/`, con procedencia confirmada por la propietaria. El hero utiliza `madrid.jpg`; las tarjetas, `ciudadania.jpg`, `urbanismo.jpg` y `profesionales-gis.png`; el cierre, `madrid-verde.jpg`. La imagen GIS se identifica como ilustración generada con IA. Véanse dimensiones, licencia declarada y créditos pendientes en [el registro de imágenes](assets/img/gallery/README.md).

Esta iteración conserva la paleta, el titular, los CTA y el visor. Las tarjetas combinan fotografía y texto, la metodología separa los radios previstos de las notas explicativas, y el proceso se presenta como una línea temporal horizontal en escritorio y vertical en móvil. Los offsets de ancla dejan espacio bajo la cabecera; cualquier enlace interno cierra el menú móvil antes de navegar. `map.js`, la configuración de Esri y los datos GIS no se modifican.

## Comprobación manual

En Live Server revisa 360, 768, 1024 y 1440 px: ausencia de desbordamiento horizontal, orden de paneles, altura de mapa y atribución. Recorre con Tab los enlaces, menú, radios (flechas) y controles disponibles; comprueba Escape y el foco. Activa movimiento reducido para revisar los desplazamientos sin animación.

Sin archivo local debe aparecer el estado pendiente. La importación de un archivo local ausente puede producir un 404 en desarrollo; se captura y no impide ejecutar la interfaz. Con clave vacía tampoco se carga el SDK. Con clave válida comprueba la cartografía real; con permisos incorrectos o red interrumpida, el aviso de error. No compartas capturas de red ni consola con tokens.

## Verificación realizada

### Fase B.4A

Pruebas con Edge y el SDK 5.1 real, mediante servidor HTTP local en `http://localhost:5500`:

- «Analizar zona» encuadra el buffer completo con 500 m y 1 km. Se verificaron los vértices en coordenadas de pantalla y que la geometría original no cambiara. Seleccionar punto o cambiar radio no ejecuta `goTo()` ni consulta automáticamente.
- En el punto −3.683, 40.415: 500 m devuelve 1 polígono de parque; 1 km devuelve 25 entidades (24 de parques y 1 de zona recreativa). Se compararon recuentos y nombres con una consulta directa de la capa: coincidieron. El listado muestra los primeros diez registros con nombre; repetir el análisis no duplica elementos.
- Ubicación real sin nombres, aproximadamente −3.618175, 40.448665: 8 entidades (6 de parques y 2 de bosques), recuentos conservados y mensaje de ausencia de nombres. También se verificó una consulta real sin resultados: todos los recuentos a cero, lista vacía y estado «Consulta sin resultados».
- Cambio de punto/radio limpia indicadores y lista. Una respuesta antigua, retrasada en la prueba y recibida después de la nueva, no sobrescribe el panel. Interrumpir la animación con «Volver a Madrid» conserva la consulta y el restablecimiento sin aviso de error. Popups y preferencia de movimiento reducido operativos.
- Panel revisado a 360/768/1024/1440 px, con capturas inspeccionadas en móvil y escritorio. Sin desbordamiento horizontal; lista limitada a diez entradas, con altura máxima de 240 px y desplazamiento. Se mantienen los puntos de adaptación y la distribución existentes.
- Una única petición del GeoJSON; sin excepciones JavaScript ni errores HTTP en la sesión normal. `map.js`, `map-layers.js`, `app.js`, configuración y GeoJSON no se modifican.

Pendientes: contraste independiente en ArcGIS Pro y comprobación desde la extensión Live Server; se usó un servidor HTTP equivalente. La capa real no contiene categorías inesperadas; la rama «Sin clasificar» se conserva para contabilizarlas si aparecieran. No se implementan superficies, recortes ni otra fase.

### Fase B.3

Pruebas en Edge con el SDK 5.1 real y un servidor HTTP en `http://localhost:5500`, sin modificar ni imprimir la configuración privada:

- Para el punto −3.683, 40.415: 1 entidad poligonal a 500 m y 25 a 1 km. Se compararon los identificadores con una comprobación separada mediante `intersectsOperator` sobre las 2.707 geometrías, proyectadas a la referencia del buffer en el código temporal de prueba. Coincidieron ambos conjuntos; las entidades devueltas conservan geometría y atributos `osm_id`, `name` y `fclass`.
- Consulta real fuera de la cobertura de la capa: cero resultados mostrado correctamente. Cambio de punto/radio: recuento invalidado y ninguna consulta automática.
- Se retrasaron respuestas reales para comprobar consultas solapadas, bloqueo de clics repetidos, descarte de respuestas antiguas y conservación del estado de carga de la consulta nueva. También se comprobó el error de consulta y el reintento.
- Se bloqueó el GeoJSON durante una carga independiente: el mapa base, los controles y el buffer siguieron funcionando; Analizar zona permaneció deshabilitado con explicación.
- Selección, Escape, popups, ambos buffers y restablecimiento operativos. Una sola petición del GeoJSON, un mapa y dos capas aun tras repetir inicializaciones. Sin excepciones JavaScript ni errores HTTP en la sesión normal. La prueba del fallo de capa provoca deliberadamente un 404.
- Sin desbordamiento horizontal a 360/768/1024/1440 px. Se conserva el CSS y no se alteran los datos.

Pendientes: contraste independiente de geometrías y recuentos en ArcGIS Pro y prueba desde la extensión Live Server de VS Code; se utilizó un servidor HTTP equivalente. La comprobación separada con otro operador del mismo SDK no sustituye la validación en ArcGIS Pro. No se implementa B.4.

### Refactorización previa a B.3

Pruebas con el SDK real y servidor HTTP en `localhost:5500`: mapa base, GeoJSON y categorías, popup real, nombres vacíos, ambos radios, nueva ubicación, Escape y restablecimiento. Los puntos y las dimensiones de los buffers coinciden con los registrados antes de simplificar el código. La carga normal no produjo errores HTTP ni excepciones JavaScript; hubo una sola petición del GeoJSON.

Las llamadas repetidas a los módulos mantuvieron un mapa, dos capas operativas (datos y gráficos) y dos gráficos. Un error fatal provocado retiró el mapa, destruyó la capa de análisis y deshabilitó la selección; cambiar el radio después no produjo excepciones. Se comprobaron menú móvil, cancelación por botón, Escape, anclas y texto del radio. La interceptación de peticiones en el navegador comprobó configuración no disponible (404), GeoJSON no disponible (el mapa base sigue operativo) y SDK bloqueado (aviso general), sin modificar archivos privados.

Se comprobaron 360/768/1024/1440 px sin desbordamiento horizontal. Los hashes previos y posteriores verifican que HTML, CSS, GeoJSON y plantilla de configuración permanecen idénticos. La validación independiente en ArcGIS Pro y las pruebas desde la extensión Live Server siguen pendientes; se usó un servidor HTTP equivalente. No se implementó B.3.

### Fase B.2

Comprobación con el SDK 5.1 real en Edge y servidor HTTP local en `http://localhost:5500`, sin modificar ni imprimir la clave. Se probaron clics reales sobre el mapa, creación del marcador y del buffer de 500 m, cambio a 1.000 m sin mover el punto y sustitución por otra ubicación. La anchura del buffer aumentó aproximadamente al doble; una comprobación esférica independiente en el código temporal de prueba situó sus vértices alrededor de 1.000 m. Esta comprobación aproximada no sustituye el contraste geodésico con ArcGIS Pro.

Escape canceló el modo conservando el punto anterior y restaurando los popups. Un clic posterior en un parque abrió su popup sin cambiar la ubicación seleccionada. Zoom, desplazamiento y «Volver a Madrid» siguieron operativos, conservando los gráficos. Se mantuvieron una sola capa de análisis, dos gráficos y una petición del GeoJSON. «Analizar» permaneció deshabilitado. No se observaron excepciones JavaScript ni errores HTTP en esta carga.

Se revisaron 360, 768, 1024 y 1440 px sin desbordamiento horizontal y una captura del buffer azul semitransparente sobre las zonas verdes. El GeoJSON original conserva su hash de B.1. Quedan pendientes el contraste de la geometría con ArcGIS Pro, las pruebas desde la extensión Live Server de VS Code (se usó un servidor HTTP equivalente) y cualquier consulta o resultado, reservados a una fase posterior autorizada.

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
- [geodesicBufferOperator: load, isLoaded y execute](https://developers.arcgis.com/javascript/latest/references/core/geometry/operators/geodesicBufferOperator/).
