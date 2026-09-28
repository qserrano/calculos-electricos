import { renderVista } from "./ui.js";

const app = document.getElementById("app");
const enlaces = document.querySelectorAll(".app-nav a");
const grupos = document.querySelectorAll(".nav-grupo");
const pantallaEstrecha = window.matchMedia("(max-width: 720px)");

const aliasRuta = {
  intensidad: "intensidad-potencia",
  potencia: "potencia-intensidad",
};

function rutaActual() {
  return window.location.hash.replace("#", "") || "inicio";
}

function calculoDeRuta(ruta) {
  const nombre = ruta.includes("/") ? ruta.split("/").pop() : ruta;
  return aliasRuta[nombre] ?? nombre;
}

function rutaDeMenu(ruta) {
  if (!ruta.includes("/")) return calculoDeRuta(ruta);
  const partes = ruta.split("/");
  const nombre = partes.pop();
  return `${partes.join("/")}/${aliasRuta[nombre] ?? nombre}`;
}

function marcarNavegacion(ruta) {
  const calculo = calculoDeRuta(ruta);
  const tieneSeccion = ruta.includes("/");
  const rutaMenu = rutaDeMenu(ruta);
  enlaces.forEach((enlace) => {
    const hash = enlace.hash.replace("#", "");
    const activa = tieneSeccion
      ? hash === rutaMenu
      : hash === calculo || hash.endsWith(`/${calculo}`);
    enlace.classList.toggle("activo", activa);
    enlace.ariaCurrent = activa ? "page" : null;
  });
}

function ajustarGrupos() {
  if (pantallaEstrecha.matches) {
    const hayActivo = document.querySelector(".app-nav a.activo");
    if (!hayActivo) return;

    grupos.forEach((grupo) => {
      grupo.open = Boolean(grupo.querySelector("a.activo"));
    });
    return;
  }

  const activo = document.querySelector(".app-nav a.activo");
  if (activo) activo.closest(".nav-grupo").open = true;
}

function actualizar() {
  const ruta = rutaActual();
  marcarNavegacion(ruta);
  ajustarGrupos();
  renderVista(app, calculoDeRuta(ruta));
}

pantallaEstrecha.addEventListener("change", () => {
  if (pantallaEstrecha.matches) {
    ajustarGrupos();
    return;
  }

  grupos.forEach((grupo) => {
    if (grupo.querySelector("a")) grupo.open = true;
  });
});

window.addEventListener("hashchange", actualizar);
actualizar();
