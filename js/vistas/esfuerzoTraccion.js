import cables from "../../data/cables.json" with { type: "json" };
import { calcularEsfuerzoTraccion } from "../calculos/esfuerzoTraccion.js";
import { formatearNumero } from "../utils/format.js";

const SIGMA_COBRE = cables.tensionMecanicaMaxima.cobre;

export function renderEsfuerzoTraccion(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Esfuerzo máximo de tracción</h2>
        <p>Calcula la fuerza máxima de tracción permitida de un circuito de cobre a partir de la tensión mecánica admisible, la sección y el número de conductores.</p>
      </header>

      <form class="form-calculo" id="form-esfuerzo-traccion" novalidate>
        <label class="campo">
          <span>Tensión mecánica máxima admisible</span>
          <span class="campo-control">
            <input type="number" name="sigma" value="${SIGMA_COBRE}" readonly />
            <span class="unidad">N/mm²</span>
          </span>
        </label>

        <label class="campo">
          <span>Sección del conductor</span>
          <span class="campo-control">
            <select name="seccion" required></select>
            <span class="unidad">mm²</span>
          </span>
        </label>

        <label class="campo">
          <span>Número de conductores</span>
          <span class="campo-control">
            <input type="number" name="conductores" min="1" step="1" required />
          </span>
        </label>

        <p class="ayuda">Para el cobre, la tensión mecánica máxima admisible es ${SIGMA_COBRE} N/mm². La fuerza permitida es esa tensión multiplicada por la sección de cada conductor y por el número de conductores.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-esfuerzo-traccion" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-esfuerzo-traccion");
  const resultado = contenedor.querySelector("#resultado-esfuerzo-traccion");

  form.elements.seccion.innerHTML = cables.secciones
    .map((seccion) => `<option value="${seccion}">${formatearSeccion(seccion)}</option>`)
    .join("");
  form.elements.seccion.value = "2.5";

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    mostrarResultado(
      resultado,
      calcularEsfuerzoTraccion({
        seccion: form.elements.seccion.value,
        conductores: form.elements.conductores.value,
      }),
    );
  });
}

function mostrarResultado(contenedor, resultado) {
  contenedor.hidden = false;

  if (!resultado.ok) {
    contenedor.className = "resultado resultado-error";
    contenedor.innerHTML = `
      <h3>Revisa los datos</h3>
      <ul>${resultado.errores.map((error) => `<li>${error}</li>`).join("")}</ul>
    `;
    return;
  }

  contenedor.className = "resultado";
  contenedor.innerHTML = `
    <h3>Resultado</h3>
    <p class="resultado-principal">
      <span>Fuerza máxima de tracción</span>
      <strong>${formatearNumero(resultado.fuerza)} N</strong>
    </p>
    <ul class="resultado-detalle">
      <li>Tensión mecánica máxima admisible: ${formatearNumero(resultado.sigma, 0)} N/mm²</li>
      <li>Sección del conductor: ${formatearSeccion(resultado.seccion)} mm²</li>
      <li>Número de conductores: ${resultado.conductores}</li>
    </ul>
    <p class="formula">Fórmula: ${resultado.formula}</p>
  `;
}

function formatearSeccion(valor) {
  return Number.isInteger(valor) ? String(valor) : String(valor);
}
