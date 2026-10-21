export async function initializeGisAnalysis(mapElement) {
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
  const radioInputs = document.querySelectorAll('input[name="radius"]');
  let selectedPoint = null;
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
      let radiusLabel = "500";
      if (radius === 1000) radiusLabel = "1.000";
      bufferStatus.textContent = `Ubicación seleccionada. Buffer de ${radiusLabel} m. Sin resultados de proximidad.`;
      if (selectingLocation) {
        bufferStatus.textContent += " Pulsa en el mapa para cambiar la ubicación; Escape cancela.";
      }
    } catch {
      bufferStatus.textContent =
        "No se ha podido dibujar el buffer. Cambia el radio o selecciona otra ubicación.";
    }
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
  for (const input of radioInputs) {
    input.addEventListener("change", updateBuffer);
  }
  document.addEventListener("keydown", handleEscape);
  selectButton.disabled = false;
  bufferStatus.textContent =
    "Selecciona una ubicación para visualizar su radio en línea recta.";

  return {
    destroy() {
      setSelectionMode(false);
      clickHandle.remove();
      selectButton.removeEventListener("click", handleSelectionButton);
      for (const input of radioInputs) {
        input.removeEventListener("change", updateBuffer);
      }
      document.removeEventListener("keydown", handleEscape);
      selectButton.disabled = true;
      mapElement.map.remove(graphicsLayer);
      graphicsLayer.destroy();
    },
  };
}
