// Carga el GeoJSON, distingue sus categorías y devuelve la capa para consultarla.
export async function addGreenSpacesLayer(map) {
  // 1. Importar las clases desde el SDK que map.js ya ha cargado
  const [SimpleFillSymbol, UniqueValueRenderer, GeoJSONLayer, PopupTemplate] =
    await $arcgis.import([
      "@arcgis/core/symbols/SimpleFillSymbol.js",
      "@arcgis/core/renderers/UniqueValueRenderer.js",
      "@arcgis/core/layers/GeoJSONLayer.js",
      "@arcgis/core/PopupTemplate.js",
    ]);

  // El identificador estable permite reutilizar la capa sin añadirla otra vez.
  const existingLayer = map.findLayerById("espacios-verdes-madrid");
  if (existingLayer) {
    await existingLayer.load();
    return existingLayer;
  }

  // 2. Crear los símbolos de las tres categorías.
  const parkSymbol = new SimpleFillSymbol({
    color: [83, 145, 91, 0.65],
    outline: { color: [36, 79, 54, 0.75], width: 0.5 },
  });
  const forestSymbol = new SimpleFillSymbol({
    color: [36, 79, 54, 0.75],
    outline: { color: [23, 59, 40, 0.8], width: 0.5 },
  });
  const recreationSymbol = new SimpleFillSymbol({
    color: [163, 187, 154, 0.7],
    outline: { color: [96, 128, 94, 0.8], width: 0.5 },
  });

  // 3. Asignar un símbolo a cada valor de fclass.
  const greenSpacesRenderer = new UniqueValueRenderer({
    field: "fclass",
    uniqueValueInfos: [
      { value: "park", label: "Parques", symbol: parkSymbol },
      { value: "forest", label: "Bosques", symbol: forestSymbol },
      {
        value: "recreation_ground",
        label: "Zonas recreativas",
        symbol: recreationSymbol,
      },
    ],
  });

  // 4. Crear la capa con su renderer. El archivo original no se modifica.
  const greenSpacesLayer = new GeoJSONLayer({
    id: "espacios-verdes-madrid",
    title: "Espacios verdes de Madrid · OpenStreetMap",
    url: new URL("../data/espacios_verdes_madrid.geojson", import.meta.url)
      .href,
    geometryType: "polygon",
    outFields: ["osm_id", "name", "fclass"],
    renderer: greenSpacesRenderer,
    copyright: "© OpenStreetMap contributors (ODbL)",
  });

  const categoryLabels = {
    park: "Parque",
    forest: "Bosque",
    recreation_ground: "Zona recreativa",
  };

  // 5. Mostrar nombre y categoría sin interpretar HTML de los atributos.
  function createPopupContent(feature) {
    const attributes = feature.graphic.attributes;
    let name = (attributes.name || "").trim();
    if (!name) name = "Espacio verde sin nombre";
    const category = categoryLabels[attributes.fclass] || "Sin clasificar";
    const content = document.createElement("div");
    const nameLine = document.createElement("p");
    const categoryLine = document.createElement("p");
    nameLine.textContent = `Nombre: ${name}`;
    categoryLine.textContent = `Categoría: ${category}`;
    content.append(nameLine, categoryLine);
    return content;
  }

  greenSpacesLayer.popupTemplate = new PopupTemplate({
    title: "Espacio verde de Madrid",
    outFields: ["osm_id", "name", "fclass"],
    returnGeometry: true,
    content: createPopupContent,
  });

  // 6. Añadir al mapa existente y devolver la instancia lista para reutilizarse.
  map.add(greenSpacesLayer);
  try {
    await greenSpacesLayer.load();
    return greenSpacesLayer;
  } catch (error) {
    map.remove(greenSpacesLayer);
    throw error;
  }
}
