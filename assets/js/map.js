const MADRID = { center: [-3.7038, 40.4168], zoom: 12 };
const SDK_URL = "https://js.arcgis.com/5.1/";
const canvas = document.querySelector("#map-canvas");
const message = document.querySelector("#map-message");
const title = document.querySelector("#map-state-title");
const description = document.querySelector("#map-state-description");
const status = document.querySelector("#map-status");
const resetButton = document.querySelector("#reset-map");

function setMapState(state, heading, detail) {
  document.querySelector(".viewer").dataset.mapState = state;
  canvas.setAttribute("aria-busy", String(state === "loading"));
  message.hidden = state === "ready";
  title.textContent = heading;
  description.textContent = detail;
  status.textContent = state === "ready" ? "Mapa base de Esri · Madrid" : heading;
  resetButton.disabled = state !== "ready";
}
function withTimeout(promise, milliseconds) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("map-timeout")), milliseconds);
    }),
  ]).finally(() => clearTimeout(timer));
}
export async function initializeMap() {
  let config;
  try {
    config = (await import("./config.local.js")).default;
  } catch {
    setMapState("unconfigured", "Mapa pendiente de configuración", "El visor de Madrid estará disponible cuando se añada la configuración local de Esri. Mientras tanto, puedes conocer la metodología y el proyecto.");
    return;
  }
  if (!config || typeof config.apiKey !== "string" || !config.apiKey.trim()) {
    setMapState("unconfigured", "Mapa pendiente de configuración", "Falta una API key válida en la configuración local de Esri. El análisis seguirá pendiente hasta incorporar los datos GIS.");
    return;
  }
  let mapElement;
  let failed = false;
  let fatalErrorHandle;
  const showFailure = () => {
    failed = true;
    fatalErrorHandle?.remove();
    setMapState("error", "No se ha podido cargar el mapa", "Comprueba tu conexión, la vigencia de la clave y sus permisos para el mapa base y el dominio local. Después, recarga la página.");
    // Release the WebGL view and stop requests after a failed initialization.
    mapElement?.remove();
  };
  setMapState("loading", "Cargando el mapa de Madrid", "Conectando con el mapa base de Esri. Puede tardar unos segundos.");
  try {
    await withTimeout(import(SDK_URL), 25000);
    const [esriConfig, Map, Basemap, reactiveUtils] = await withTimeout(window.$arcgis.import([
      "@arcgis/core/config.js",
      "@arcgis/core/Map.js",
      "@arcgis/core/Basemap.js",
      "@arcgis/core/core/reactiveUtils.js",
    ]), 25000);
    esriConfig.apiKey = config.apiKey.trim();
    await withTimeout(customElements.whenDefined("arcgis-map"), 25000);
    const basemap = new Basemap({ style: { id: config.basemapStyle || "arcgis/light-gray", language: "es" } });
    mapElement = document.createElement("arcgis-map");
    mapElement.setAttribute("aria-label", "Mapa interactivo de Madrid. Usa los controles de zoom o las teclas de navegación del mapa.");
    mapElement.setAttribute("center", MADRID.center.join(","));
    mapElement.setAttribute("zoom", String(MADRID.zoom));
    mapElement.map = new Map({ basemap });
    const zoomControl = document.createElement("arcgis-zoom");
    zoomControl.setAttribute("slot", "top-left");
    mapElement.append(zoomControl);
    mapElement.addEventListener("arcgisViewReadyError", showFailure, { once: true });
    canvas.prepend(mapElement);
    await withTimeout(Promise.all([mapElement.viewOnReady(), basemap.loadAll()]), 30000);
    if (failed) return;
    mapElement.view.on("layerview-create-error", showFailure);
    fatalErrorHandle = reactiveUtils.watch(() => mapElement.view?.fatalError, (error) => {
      if (error) showFailure();
    }, { initial: true });
    if (failed) return;
    setMapState("ready", "Mapa disponible", "Explora Madrid con zoom y desplazamiento.");
    resetButton.addEventListener("click", async () => {
      resetButton.disabled = true;
      try {
        await mapElement.view.goTo(MADRID, { animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches });
      } catch (error) {
        if (error.name !== "AbortError") status.textContent = "No se ha podido volver a Madrid. Inténtalo de nuevo.";
      } finally {
        if (!failed) resetButton.disabled = false;
      }
    });
  } catch {
    // Never print SDK errors: request URLs can contain the browser API key.
    showFailure();
  }
}
