# Espacios verdes de Madrid · Fase B.1

Archivo entregado por la propietaria: `espacios_verdes_madrid.geojson`. La aplicación lo utiliza sin modificarlo.

Procedencia declarada: **OpenStreetMap → extracción de Geofabrik → preparación en ArcGIS Pro**. Esta entrega sustituye la fuente municipal prevista inicialmente; no atribuir este GeoJSON al Ayuntamiento.

Licencia: [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Atribución: [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright). La atribución se muestra junto al visor, en el pie y en la capa del SDK.

## Inspección local del archivo

- `FeatureCollection` con 2.707 entidades: 2.676 `Polygon` y 31 `MultiPolygon`, ambos representados como polígonos en ArcGIS.
- Campos presentes: `OBJECTID`, `osm_id`, `code`, `fclass`, `name`, `Shape_Length` y `Shape_Area`. Los campos requeridos están presentes en todas las entidades.
- Categorías observadas: `park`, `forest` y `recreation_ground`.
- `osm_id`, `name` y `fclass` son cadenas en el esquema inicial. Hay nombres vacíos; el popup contempla este caso sin alterar los atributos originales.
- Coordenadas longitud/latitud, con extremos aproximados −3,889 a −3,522 y 40,320 a 40,643: compatibles con el entorno de Madrid y el WGS84 exigido por GeoJSON. El archivo no declara un miembro `crs`. Esto no sustituye la validación de exportación en ArcGIS Pro.
- SHA-256 del original inspeccionado: `65ba364c5cc51995fb4040f8ec7950a51e56e3c7f6b3e53c820a4a1266567ff5`.

Pendientes de documentar por la propietaria: URL y fecha exactas del extracto de Geofabrik, fecha de referencia de OSM, criterios de recorte/selección y pasos de preparación/exportación. La extensión observada no acredita cobertura completa de todos los espacios verdes de Madrid.

## Alcance autorizado

B.1 solo carga, simboliza y presenta nombre/categoría mediante `GeoJSONLayer`. No calcula superficies, distancias ni proximidad; no utiliza `Shape_Area` como metros cuadrados. Las mediciones futuras requieren un método métrico adecuado, verificación frente a ArcGIS Pro y autorización para la siguiente fase.
