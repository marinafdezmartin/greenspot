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
  if (!link || !document.querySelector(link.hash)) return;
  closeMenu();
  // Move focus away from an anchor hidden by the mobile menu.
  if (mobileLayout.matches && navigation.contains(link)) {
    const target = document.querySelector(link.hash);
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
        if (link.hash === `#${entry.target.id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    }
  }, { rootMargin: "-15% 0px -50% 0px", threshold: 0 });
  navigationLinks.forEach((link) => observer.observe(document.querySelector(link.hash)));
}
document.querySelectorAll('input[name="radius"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    document.querySelector("#selected-radius").textContent = radio.value === "1000" ? "1 km" : "500 m";
  });
});
initializeMap();
