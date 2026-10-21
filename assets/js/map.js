import { addGreenSpacesLayer } from "./map-layers.js";
import { initializeGisAnalysis } from "./gis-analysis.js";

const MADRID = { center: [-3.7038, 40.4168], zoom: 12 };
const SDK_URL = "https://js.arcgis.com/5.1/";
const canvas = document.querySelector("#map-canvas");
const message = document.querySelector("#map-message");
const title = document.querySelector("#map-state-title");
const description = document.querySelector("#map-state-description");
const status = document.querySelector("#map-status");
const resetButton = document.querySelector("#reset-map");
const greenSpacesStatus = document.querySelector("#green-spaces-status");
let mapStarted = false;

function setMapState(state, heading, detail) {
  document.querySelector(".viewer").dataset.mapState = state;
  canvas.setAttribute("aria-busy", String(state === "loading"));
  message.hidden = state === "ready";
  title.textContent = heading;
  description.textContent = detail;
  if (state === "ready") {
    status.textContent = "Mapa base de Esri · Madrid";
  } else {
    status.textContent = heading;
  }
  resetButton.disabled = state !== "ready";
}
export async function initializeMap() {
  // app.js inicia un único visor, aunque se vuelva a llamar a esta función.
  if (mapStarted) return;
  mapStarted = true;

  let config;
  try {
    config = (await import("./config.local.js")).default;
  } catch {
    setMapState(
      "unconfigured",
      "Mapa pendiente de configuración",
      "El visor de Madrid estará disponible cuando se añada la configuración local de Esri. Mientras tanto, puedes conocer la metodología y el proyecto.",
    );
    return;
  }
  if (!config || typeof config.apiKey !== "string" || !config.apiKey.trim()) {
    setMapState(
      "unconfigured",
      "Mapa pendiente de configuración",
      "Falta una API key válida en la configuración local de Esri. El análisis seguirá pendiente hasta incorporar los datos GIS.",
    );
    return;
  }
  let mapElement;
  let failed = false;
  let fatalErrorHandle;
  let gisAnalysis;
  let initializationTimeout;

  function showFailure() {
    if (failed) return;
    failed = true;
    clearTimeout(initializationTimeout);
    fatalErrorHandle?.remove();
    gisAnalysis?.destroy();
    resetButton.removeEventListener("click", resetMap);
    setMapState(
      "error",
      "No se ha podido cargar el mapa",
      "Comprueba tu conexión, la vigencia de la clave y sus permisos para el mapa base y el dominio local. Después, recarga la página.",
    );
    // Al retirar el componente se liberan la vista y sus eventos GIS.
    mapElement?.remove();
  }

  async function resetMap() {
    resetButton.disabled = true;
    try {
      await mapElement.view.goTo(MADRID, {
        animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        status.textContent = "No se ha podido volver a Madrid. Inténtalo de nuevo.";
      }
    } finally {
      if (!failed) resetButton.disabled = false;
    }
  }
  setMapState(
    "loading",
    "Cargando el mapa de Madrid",
    "Conectando con el mapa base de Esri. Puede tardar unos segundos.",
  );
  // Un solo límite para toda la inicialización, en lugar de envolver cada espera.
  initializationTimeout = setTimeout(showFailure, 30000);
  try {
    await import(SDK_URL);
    const [esriConfig, Map, Basemap, reactiveUtils] =
      await $arcgis.import([
        "@arcgis/core/config.js",
        "@arcgis/core/Map.js",
        "@arcgis/core/Basemap.js",
        "@arcgis/core/core/reactiveUtils.js",
      ]);
    if (failed) return;
    esriConfig.apiKey = config.apiKey.trim();
    await customElements.whenDefined("arcgis-map");
    if (failed) return;
    const basemap = new Basemap({
      style: { id: config.basemapStyle || "arcgis/light-gray", language: "es" },
    });
    mapElement = document.createElement("arcgis-map");
    mapElement.setAttribute(
      "aria-label",
      "Mapa interactivo de Madrid. Usa los controles de zoom o las teclas de navegación del mapa.",
    );
    mapElement.setAttribute("center", MADRID.center.join(","));
    mapElement.setAttribute("zoom", String(MADRID.zoom));
    mapElement.map = new Map({ basemap });
    const zoomControl = document.createElement("arcgis-zoom");
    zoomControl.setAttribute("slot", "top-left");
    mapElement.append(zoomControl);
    canvas.prepend(mapElement);
    await mapElement.viewOnReady();
    await basemap.loadAll();
    if (failed) return;
    clearTimeout(initializationTimeout);
    mapElement.view.on("layerview-create-error", (event) => {
      // Solo un fallo del mapa base debe activar el error general del visor.
      if (
        basemap.baseLayers.includes(event.layer) ||
        basemap.referenceLayers.includes(event.layer)
      ) {
        showFailure();
      } else if (event.layer.id === "espacios-verdes-madrid") {
        greenSpacesStatus.textContent =
          "No se ha podido representar la capa. El mapa base sigue disponible.";
      }
    });
    fatalErrorHandle = reactiveUtils.watch(
      () => mapElement.view?.fatalError,
      (error) => {
        if (error) showFailure();
      },
      { initial: true },
    );
    if (failed) return;
    setMapState(
      "ready",
      "Mapa disponible",
      "Explora Madrid con zoom y desplazamiento.",
    );
    resetButton.addEventListener("click", resetMap);
  } catch {
    // No registrar errores del SDK: sus URLs pueden contener la API key.
    showFailure();
    return;
  }

  // La carga de datos tiene su propio error y no bloquea los controles del mapa.
  greenSpacesStatus.textContent = "Cargando espacios verdes…";
  try {
    const greenSpacesLayer = await addGreenSpacesLayer(mapElement.map);
    await mapElement.view.whenLayerView(greenSpacesLayer);
    if (!failed) greenSpacesStatus.textContent = "Capa disponible";
  } catch {
    greenSpacesStatus.textContent =
      "No se ha podido cargar la capa. El mapa base sigue disponible.";
  }

  if (failed) return;
  try {
    const controls = await initializeGisAnalysis(mapElement);
    if (failed) {
      controls?.destroy();
    } else {
      gisAnalysis = controls;
    }
  } catch {
    document.querySelector("#buffer-status").textContent =
      "No se ha podido preparar el buffer. Recarga la página. El mapa sigue disponible.";
  }
}
