import { initializeMap } from "./map.js";

const navigation = document.querySelector("#main-navigation");
const menuToggle = document.querySelector(".menu-toggle");
const mobileLayout = window.matchMedia("(max-width: 767px)");
document.documentElement.classList.add("js-enabled");
menuToggle.hidden = false;

function closeMenu() {
  navigation.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const target = document.querySelector(link.hash);
  if (!target) return;
  closeMenu();
  // El foco debe salir del enlace que se oculta al cerrar el menú móvil.
  if (mobileLayout.matches && navigation.contains(link)) {
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navigation.classList.contains("is-open")) {
    closeMenu();
    menuToggle.focus();
  }
});
mobileLayout.addEventListener("change", closeMenu);

const navigationLinks = [...navigation.querySelectorAll("a")];
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of navigationLinks) {
        if (link.hash === `#${entry.target.id}`) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      }
    }
  }, { rootMargin: "-15% 0px -50% 0px", threshold: 0 });
  for (const link of navigationLinks) {
    observer.observe(document.querySelector(link.hash));
  }
}
for (const radio of document.querySelectorAll('input[name="radius"]')) {
  radio.addEventListener("change", () => {
    if (radio.value === "1000") {
      document.querySelector("#selected-radius").textContent = "1 km";
    } else {
      document.querySelector("#selected-radius").textContent = "500 m";
    }
  });
}
initializeMap();
