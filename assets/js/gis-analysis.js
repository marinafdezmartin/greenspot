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

  function invalidateAnalysis() {
    // Una respuesta pendiente ya no pertenece al punto o al radio actuales.
    queryVersion += 1;
    analyzing = false;
    analyzeButton.disabled = !currentBuffer || !greenSpacesLayer;
    analyzeButton.setAttribute("aria-busy", "false");
    analysisState.textContent = "Sin analizar";
    polygonCount.textContent = "Pendiente";
    if (!greenSpacesLayer) {
      analysisHelp.textContent = "Consulta no disponible: no se ha podido preparar la capa de espacios verdes.";
      analysisResult.textContent = "Puedes seleccionar una ubicación y visualizar su buffer. La consulta requiere la capa de espacios verdes.";
    } else if (!currentBuffer) {
      analysisHelp.textContent = "Selecciona una ubicación para habilitar la consulta espacial.";
      analysisResult.textContent = "Selecciona una ubicación, elige el radio y pulsa Analizar zona.";
    } else {
      analysisHelp.textContent = "Pulsa Analizar zona para consultar los polígonos que intersectan el buffer.";
      analysisResult.textContent = "Buffer actualizado. Pulsa Analizar zona para obtener el recuento.";
    }
  }

  async function analyzeZone() {
    if (!currentBuffer || !greenSpacesLayer || analyzing) return;
    analyzing = true;
    queryVersion += 1;
    const version = queryVersion;
    let radiusLabel = "500 m";
    if (document.querySelector('input[name="radius"]:checked').value === "1000") {
      radiusLabel = "1 km";
    }
    analyzeButton.disabled = true;
    analyzeButton.setAttribute("aria-busy", "true");
    analysisState.textContent = "Consultando";
    polygonCount.textContent = "Pendiente";
    analysisResult.textContent = "Consultando los espacios verdes que intersectan el buffer…";

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
      polygonCount.textContent = String(espaciosEncontrados.length);
      analysisState.textContent = "Consulta realizada";
      analysisResult.textContent = `${espaciosEncontrados.length} polígonos de espacios verdes encontrados en un radio de ${radiusLabel}.`;
    } catch {
      if (version !== queryVersion) return;
      analysisState.textContent = "Consulta no completada";
      analysisResult.textContent = "No se ha podido consultar la capa. Pulsa Analizar zona para intentarlo de nuevo.";
    } finally {
      // Una consulta antigua tampoco debe cambiar el botón de otra más reciente.
      if (version === queryVersion) {
        analyzing = false;
        analyzeButton.disabled = false;
        analyzeButton.setAttribute("aria-busy", "false");
      }
    }
  }

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
      bufferStatus.textContent = `Ubicación seleccionada. Buffer de ${radiusLabel} m. Proximidad en línea recta.`;
      if (selectingLocation) {
        bufferStatus.textContent += " Pulsa en el mapa para cambiar la ubicación; Escape cancela.";
      }
    } catch {
      bufferStatus.textContent =
        "No se ha podido dibujar el buffer. Cambia el radio o selecciona otra ubicación.";
    }
    invalidateAnalysis();
  }

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

  function cancelSelection() {
    setSelectionMode(false);
    bufferStatus.textContent =
      "Selección cancelada. Se conserva la ubicación anterior, si existe.";
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
  bufferStatus.textContent =
    "Selecciona una ubicación para visualizar su radio en línea recta.";

  return {
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
