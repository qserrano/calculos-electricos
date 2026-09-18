import { renderVista } from "./ui.js";

const app = document.getElementById("app");
const enlaces = document.querySelectorAll(".app-nav a");

function rutaActual() {
  return window.location.hash.replace("#", "") || "intensidad";
}

function marcarNavegacion(ruta) {
  enlaces.forEach((enlace) => {
    const activa = enlace.hash === `#${ruta}`;
    enlace.classList.toggle("activo", activa);
    enlace.ariaCurrent = activa ? "page" : null;
  });
}

function actualizar() {
  const ruta = rutaActual();
  marcarNavegacion(ruta);
  renderVista(app, ruta);
}

window.addEventListener("hashchange", actualizar);
actualizar();
