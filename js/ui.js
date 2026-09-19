import { renderIntensidad } from "./vistas/intensidad.js";
import { renderPotencia } from "./vistas/potencia.js";
import { renderSeccionConductor } from "./vistas/seccionConductor.js";
import { renderCaidaTension } from "./vistas/caidaTension.js";
import { renderProtecciones } from "./vistas/protecciones.js";

const titulos = {
  inicio: "Inicio",
};

export function renderVista(contenedor, ruta) {
  if (ruta === "inicio") {
    contenedor.innerHTML = `
      <section class="pantalla-inicio">
        <p>Seleccione el cálculo requerido</p>
      </section>
    `;
    return;
  }

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

  if (ruta === "caida-tension") {
    renderCaidaTension(contenedor);
    return;
  }

  if (ruta === "protecciones") {
    renderProtecciones(contenedor);
    return;
  }

  const titulo = titulos[ruta] ?? "Cálculo no encontrado";
  contenedor.innerHTML = `<h2>${titulo}</h2>`;
}
