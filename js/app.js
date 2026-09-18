import { renderVista } from "./ui.js";

const app = document.getElementById("app");
const enlaces = document.querySelectorAll(".app-nav a");

const aliasRuta = {
  intensidad: "intensidad-potencia",
  potencia: "potencia-intensidad",
};

function rutaActual() {
  return window.location.hash.replace("#", "") || "intensidad-potencia";
}

function marcarNavegacion(ruta) {
  const rutaMenu = aliasRuta[ruta] ?? ruta;
  enlaces.forEach((enlace) => {
    const activa = enlace.hash === `#${rutaMenu}`;
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
