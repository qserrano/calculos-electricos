import { renderIntensidad } from "./vistas/intensidad.js";
import { renderPotencia } from "./vistas/potencia.js";
import { renderSeccionConductor } from "./vistas/seccionConductor.js";
import { renderCaidaTension } from "./vistas/caidaTension.js";
import { renderProtecciones } from "./vistas/protecciones.js";
import { renderResistenciaConductor } from "./vistas/resistenciaConductor.js";
import { renderPrevisionCargas } from "./vistas/previsionCargas.js";
import { renderPotenciaActivaReactivaAparente } from "./vistas/potenciaActivaReactivaAparente.js";

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

  if (ruta === "potencia-activa-reactiva-aparente") {
    renderPotenciaActivaReactivaAparente(contenedor);
    return;
  }

  if (ruta === "prevision-cargas") {
    renderPrevisionCargas(contenedor);
    return;
  }

  if (ruta === "seccion-conductor") {
    renderSeccionConductor(contenedor);
    return;
  }

  if (ruta === "resistencia-conductor") {
    renderResistenciaConductor(contenedor);
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
