// Conecta los controles con el mapa y prepara los gráficos del análisis.
export async function initializeGisAnalysis(mapElement, greenSpacesLayer) {
  const [
    Graphic,
    GraphicsLayer,
    SimpleMarkerSymbol,
    SimpleFillSymbol,
    geodesicBufferOperator,
  ] = await $arcgis.import([
    "@arcgis/core/Graphic.js",
    "@arcgis/core/layers/GraphicsLayer.js",
    "@arcgis/core/symbols/SimpleMarkerSymbol.js",
    "@arcgis/core/symbols/SimpleFillSymbol.js",
    "@arcgis/core/geometry/operators/geodesicBufferOperator.js",
  ]);

  // Preparar el operador una sola vez, antes de habilitar la selección.
  if (!geodesicBufferOperator.isLoaded()) {
    await geodesicBufferOperator.load();
  }
  if (!mapElement.isConnected) return;
  if (mapElement.map.findLayerById("analysis-graphics")) return;

  const view = mapElement.view;
  const selectButton = document.querySelector("#select-location");
  const bufferStatus = document.querySelector("#buffer-status");
  const analyzeButton = document.querySelector(".analyze-button");
  const analysisHelp = document.querySelector("#analysis-help");
  const analysisState = document.querySelector("#analysis-state");
  const analysisResult = document.querySelector("#analysis-result");
  const polygonCount = document.querySelector("#polygon-count");
  const parkCount = document.querySelector("#park-count");
  const forestCount = document.querySelector("#forest-count");
  const recreationCount = document.querySelector("#recreation-count");
  const otherCount = document.querySelector("#other-count");
  const otherCategoryRow = document.querySelector("#other-category-row");
  const namedSpacesList = document.querySelector("#named-spaces-list");
  const listMessage = document.querySelector("#list-message");
  const radioInputs = document.querySelectorAll('input[name="radius"]');
  let selectedPoint = null;
  let currentBuffer = null;
  let queryVersion = 0;
  let analyzing = false;
  let selectingLocation = false;
  let previousPopupEnabled = view.popupEnabled;
  let previousCursor = view.container.style.cursor;

  // Símbolos del punto y del buffer.
  const pointSymbol = new SimpleMarkerSymbol({
    color: [39, 109, 168, 1],
    size: 11,
    outline: { color: "white", width: 2 },
  });
  const bufferSymbol = new SimpleFillSymbol({
    color: [39, 109, 168, 0.18],
    outline: { color: [39, 109, 168, 0.9], width: 1 },
  });

  // Una sola capa para todos los cambios de ubicación y radio.
  const graphicsLayer = new GraphicsLayer({
    id: "analysis-graphics",
    title: "Ubicación seleccionada y buffer geodésico",
  });
  mapElement.map.add(graphicsLayer);

  // Vacía el resumen y los nombres antes de mostrar otro resultado.
  function clearResults() {
    polygonCount.textContent = "—";
    for (const count of [parkCount, forestCount, recreationCount, otherCount]) {
      count.textContent = "—";
    }
    otherCategoryRow.hidden = true;
    namedSpacesList.replaceChildren();
    namedSpacesList.hidden = true;
    listMessage.textContent =
      "Aquí verás los espacios identificados por su nombre.";
  }

  // Cuenta las áreas de cada categoría y muestra hasta diez nombres reales.
  function showResults(espaciosEncontrados) {
    let parks = 0;
    let forests = 0;
    let recreationGrounds = 0;
    let otherCategories = 0;
    const namedSpaces = [];

    for (const feature of espaciosEncontrados) {
      const attributes = feature.attributes;
      let category = "Sin clasificar";
      if (attributes.fclass === "park") {
        parks += 1;
        category = "Parque";
      } else if (attributes.fclass === "forest") {
        forests += 1;
        category = "Bosque";
      } else if (attributes.fclass === "recreation_ground") {
        recreationGrounds += 1;
        category = "Zona recreativa";
      } else {
        otherCategories += 1;
      }

      const name = (attributes.name || "").trim();
      if (name) namedSpaces.push({ name, category });
    }

    polygonCount.textContent = String(espaciosEncontrados.length);
    parkCount.textContent = String(parks);
    forestCount.textContent = String(forests);
    recreationCount.textContent = String(recreationGrounds);
    otherCount.textContent = String(otherCategories);
    otherCategoryRow.hidden = otherCategories === 0;

    // Solo nombres reales; los polígonos sin nombre también cuentan en el total.
    const visibleSpaces = namedSpaces.slice(0, 10);
    namedSpacesList.hidden = visibleSpaces.length === 0;
    for (const space of visibleSpaces) {
      const item = document.createElement("li");
      const name = document.createElement("span");
      const category = document.createElement("span");
      name.textContent = space.name;
      category.textContent = space.category;
      item.append(name, category);
      namedSpacesList.append(item);
    }
    if (espaciosEncontrados.length === 0) {
      listMessage.textContent =
        "No hay espacios verdes registrados en este radio.";
    } else if (namedSpaces.length === 0) {
      listMessage.textContent =
        "Las áreas encontradas no tienen nombre en OpenStreetMap.";
    } else {
      listMessage.textContent = `Mostrando ${visibleSpaces.length} de ${namedSpaces.length} áreas con nombre.`;
    }
  }

  // Al cambiar el punto o el radio, descarta el resumen y las respuestas antiguas.
  function invalidateAnalysis() {
    // Una respuesta pendiente ya no pertenece al punto o al radio actuales.
    queryVersion += 1;
    analyzing = false;
    analyzeButton.disabled = !currentBuffer || !greenSpacesLayer;
    analyzeButton.setAttribute("aria-busy", "false");
    analysisState.textContent = "Sin analizar";
    clearResults();
    if (!greenSpacesLayer) {
      analysisHelp.textContent =
        "Los datos no están disponibles. Recarga la página para volver a intentarlo.";
      analysisResult.textContent =
        "No se pueden obtener resultados ahora. Puedes seguir explorando el mapa.";
    } else if (!currentBuffer) {
      analysisHelp.textContent = "Selecciona una ubicación para empezar.";
      analysisResult.textContent = "Tu resumen aparecerá aquí.";
    } else {
      analysisHelp.textContent = "";
      analysisResult.textContent = "Todo listo para analizar tu entorno.";
    }
  }

  // Encuadra el radio y busca las áreas verdes que quedan dentro o lo tocan.
  async function analyzeZone() {
    if (!currentBuffer || !greenSpacesLayer || analyzing) return;
    analyzing = true;
    queryVersion += 1;
    const version = queryVersion;
    let radiusLabel = "500 m";
    if (
      document.querySelector('input[name="radius"]:checked').value === "1000"
    ) {
      radiusLabel = "1 km";
    }
    analyzeButton.disabled = true;
    analyzeButton.setAttribute("aria-busy", "true");
    analysisState.textContent = "Consultando";
    clearResults();
    analysisResult.textContent = "Buscando áreas verdes en tu entorno…";

    // Ampliar una copia de la extensión deja margen sin modificar el buffer.
    try {
      await view.goTo(currentBuffer.extent.clone().expand(1.3), {
        animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    } catch (error) {
      // Un gesto o Restablecer mapa pueden interrumpir la navegación normalmente.
      if (error.name !== "AbortError" && version === queryVersion) {
        bufferStatus.textContent =
          "No se ha podido centrar el mapa. Puedes continuar el análisis.";
      }
    }
    if (version !== queryVersion) return;

    try {
      // createQuery() devuelve un objeto Query con la configuración de la capa.
      const query = greenSpacesLayer.createQuery();
      query.geometry = currentBuffer;
      query.spatialRelationship = "intersects";
      query.outFields = ["*"];
      query.returnGeometry = true;

      const resultado = await greenSpacesLayer.queryFeatures(query);
      if (version !== queryVersion) return;
      const espaciosEncontrados = resultado.features;
      showResults(espaciosEncontrados);
      analysisState.textContent = "Consulta realizada";
      if (espaciosEncontrados.length === 0) {
        analysisState.textContent = "Consulta sin resultados";
      }
      analysisResult.textContent = `Áreas verdes en un radio de ${radiusLabel} alrededor del punto elegido.`;
    } catch {
      if (version !== queryVersion) return;
      analysisState.textContent = "Error de consulta";
      analysisResult.textContent =
        "No se han podido obtener los resultados. Vuelve a intentarlo.";
    } finally {
      // Una consulta antigua tampoco debe cambiar el botón de otra más reciente.
      if (version === queryVersion) {
        analyzing = false;
        analyzeButton.disabled = false;
        analyzeButton.setAttribute("aria-busy", "false");
      }
    }
  }

  // Activa el clic de selección y pausa los popups hasta elegir el punto.
  function setSelectionMode(enabled) {
    if (enabled === selectingLocation) return;
    selectingLocation = enabled;
    selectButton.setAttribute("aria-pressed", String(enabled));
    if (enabled) {
      selectButton.textContent = "Cancelar selección";
      previousPopupEnabled = view.popupEnabled;
      previousCursor = view.container.style.cursor;
      view.popupEnabled = false;
      view.closePopup();
      view.container.style.cursor = "crosshair";
      bufferStatus.textContent =
        "Pulsa sobre el mapa para elegir una ubicación. Escape cancela.";
    } else {
      if (selectedPoint) {
        selectButton.textContent = "Cambiar ubicación";
      } else {
        selectButton.textContent = "Seleccionar ubicación";
      }
      view.popupEnabled = previousPopupEnabled;
      view.container.style.cursor = previousCursor;
    }
  }

  // Genera el buffer en metros y sustituye los gráficos de la ubicación anterior.
  function updateBuffer() {
    if (!selectedPoint) return;
    currentBuffer = null;
    const radius = Number(
      document.querySelector('input[name="radius"]:checked').value,
    );
    const pointGraphic = new Graphic({
      geometry: selectedPoint,
      symbol: pointSymbol,
    });

    // Retirar la representación anterior también si el nuevo cálculo falla.
    graphicsLayer.removeAll();
    graphicsLayer.add(pointGraphic);
    try {
      const bufferGeometry = geodesicBufferOperator.execute(
        selectedPoint,
        radius,
        { unit: "meters" },
      );
      // El operador devuelve un Polygon o un valor vacío si no puede generarlo.
      if (!bufferGeometry) {
        throw new Error("Buffer no válido");
      }

      const bufferGraphic = new Graphic({
        geometry: bufferGeometry,
        symbol: bufferSymbol,
      });
      // Dibujar el buffer debajo del marcador, sin ocultar los espacios verdes.
      graphicsLayer.add(bufferGraphic, 0);
      currentBuffer = bufferGeometry;
      let radiusLabel = "500";
      if (radius === 1000) radiusLabel = "1.000";
      bufferStatus.textContent = `Ubicación elegida · radio de ${radiusLabel} m.`;
      if (selectingLocation) {
        bufferStatus.textContent +=
          " Pulsa en el mapa para cambiar la ubicación; Escape cancela.";
      }
    } catch {
      bufferStatus.textContent =
        "No se ha podido dibujar el radio. Cambia la distancia o elige otro punto.";
    }
    invalidateAnalysis();
  }

  // Guarda la geometría del clic solo cuando está activo el modo de selección.
  function handleMapClick(event) {
    if (!selectingLocation || !event.mapPoint) return;
    event.stopPropagation();
    // mapPoint es la geometría Point del clic, con la referencia espacial del visor.
    selectedPoint = event.mapPoint.clone();
    setSelectionMode(false);
    updateBuffer();
  }

  function handleSelectionButton() {
    if (selectingLocation) {
      cancelSelection();
    } else {
      setSelectionMode(true);
    }
  }

  // Sale del modo de selección sin borrar el punto que ya estaba elegido.
  function cancelSelection() {
    setSelectionMode(false);
    bufferStatus.textContent = "Selección cancelada.";
  }

  function handleEscape(event) {
    if (event.key !== "Escape" || !selectingLocation) return;
    cancelSelection();
    selectButton.focus();
  }

  // Los controladores se registran una vez; las interacciones solo cambian el estado.
  const clickHandle = view.on("click", handleMapClick);
  selectButton.addEventListener("click", handleSelectionButton);
  analyzeButton.addEventListener("click", analyzeZone);
  for (const input of radioInputs) {
    input.addEventListener("change", updateBuffer);
  }
  document.addEventListener("keydown", handleEscape);
  selectButton.disabled = false;
  invalidateAnalysis();
  bufferStatus.textContent = "Pulsa el botón y elige un punto en el mapa.";

  return {
    // Retira los eventos y gráficos si se cierra el visor.
    destroy() {
      setSelectionMode(false);
      clickHandle.remove();
      selectButton.removeEventListener("click", handleSelectionButton);
      analyzeButton.removeEventListener("click", analyzeZone);
      for (const input of radioInputs) {
        input.removeEventListener("change", updateBuffer);
      }
      document.removeEventListener("keydown", handleEscape);
      selectButton.disabled = true;
      currentBuffer = null;
      greenSpacesLayer = null;
      invalidateAnalysis();
      mapElement.map.remove(graphicsLayer);
      graphicsLayer.destroy();
    },
  };
}
