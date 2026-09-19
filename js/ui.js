import { renderIntensidad } from "./vistas/intensidad.js";
import { renderPotencia } from "./vistas/potencia.js";
import { renderSeccionConductor } from "./vistas/seccionConductor.js";

const titulos = {
  inicio: "Inicio",
  "caida-tension": "Caída de tensión",
  protecciones: "Protecciones",
};

export function renderVista(contenedor, ruta) {
  if (ruta === "intensidad" || ruta === "intensidad-potencia") {
    renderIntensidad(contenedor);
    return;
  }

  if (ruta === "potencia" || ruta === "potencia-intensidad") {
    renderPotencia(contenedor);
    return;
  }

  if (ruta === "seccion-conductor") {
    renderSeccionConductor(contenedor);
    return;
  }

  const titulo = titulos[ruta] ?? "Cálculo no encontrado";
  contenedor.innerHTML = `<h2>${titulo}</h2>`;
}
