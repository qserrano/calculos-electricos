import { renderIntensidad } from "./vistas/intensidad.js";

const titulos = {
  inicio: "Inicio",
  "seccion-conductor": "Sección de conductor",
  "caida-tension": "Caída de tensión",
  intensidad: "Intensidad",
  protecciones: "Protecciones",
};

export function renderVista(contenedor, ruta) {
  if (ruta === "intensidad") {
    renderIntensidad(contenedor);
    return;
  }

  const titulo = titulos[ruta] ?? "Cálculo no encontrado";
  contenedor.innerHTML = `<h2>${titulo}</h2>`;
}
