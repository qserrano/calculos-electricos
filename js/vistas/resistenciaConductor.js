import cables from "../../data/cables.json" with { type: "json" };
import constantesArchivo from "../../data/constantes.json" with { type: "json" };
import { calcularResistenciaConductor } from "../calculos/resistenciaConductor.js";
import { formatearNumero } from "../utils/format.js";

const constantes = {
  seccionMinimaAluminio: 16,
  ...constantesArchivo,
};

export function renderResistenciaConductor(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Resistencia de conductor</h2>
        <p>Calcula la resistencia de un conductor a partir de la longitud, la sección, el material y el aislante.</p>
      </header>

      <form class="form-calculo" id="form-resistencia" novalidate>
        <fieldset class="campo">
          <legend>Material</legend>
          <div class="opciones">
            <label>
              <input type="radio" name="material" value="cobre" checked />
              Cobre
            </label>
            <label>
              <input type="radio" name="material" value="aluminio" />
              Aluminio
            </label>
          </div>
        </fieldset>

        <fieldset class="campo">
          <legend>Aislante</legend>
          <div class="opciones">
            <label>
              <input type="radio" name="aislante" value="pvc" checked />
              PVC (70 °C)
            </label>
            <label>
              <input type="radio" name="aislante" value="xlpe" />
              XLPE / EPR (90 °C)
            </label>
          </div>
        </fieldset>

        <label class="campo">
          <span>Longitud</span>
          <span class="campo-control">
            <input type="number" name="longitud" min="0" step="any" required />
            <span class="unidad">m</span>
          </span>
        </label>

        <label class="campo">
          <span>Sección</span>
          <span class="campo-control">
            <select name="seccion" required></select>
            <span class="unidad">mm²</span>
          </span>
        </label>

        <p class="ayuda">El resultado es la resistencia de un solo conductor. El aislante fija la temperatura de servicio: a más temperatura, más resistencia. En un circuito monofásico la ida y el retorno suman 2·R.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-resistencia" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-resistencia");
  const resultado = contenedor.querySelector("#resultado-resistencia");
  const campoSeccion = form.elements.seccion;

  rellenarSecciones(campoSeccion, "cobre", 2.5);

  form.querySelectorAll('input[name="material"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      rellenarSecciones(campoSeccion, radio.value, Number(campoSeccion.value));
    });
  });

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = {
      longitud: form.elements.longitud.value,
      seccion: form.elements.seccion.value,
      material: form.elements.material.value,
      aislante: form.elements.aislante.value,
    };

    mostrarResultado(resultado, calcularResistenciaConductor(datos));
  });
}

function rellenarSecciones(select, material, preferida) {
  const minima = material === "aluminio" ? constantes.seccionMinimaAluminio : 0;
  const secciones = cables.secciones.filter((seccion) => seccion >= minima);
  select.innerHTML = secciones
    .map((seccion) => `<option value="${seccion}">${formatearSeccion(seccion)}</option>`)
    .join("");

  if (secciones.includes(preferida)) {
    select.value = String(preferida);
  }
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

  const etiquetaMaterial = resultado.material === "aluminio" ? "aluminio" : "cobre";

  contenedor.className = "resultado";
  contenedor.innerHTML = `
    <h3>Resultado</h3>
    <p class="resultado-principal">
      <span>Resistencia a ${resultado.temperaturaServicio} °C</span>
      <strong>${formatearNumero(resultado.resistenciaServicio, 4)} Ω</strong>
    </p>
    <ul class="resultado-detalle">
      <li>Resistencia a 20 °C: ${formatearNumero(resultado.resistencia20, 4)} Ω</li>
      <li>Material: ${etiquetaMaterial} (γ20 = ${resultado.gamma20} m/(Ω·mm²), α = ${resultado.alfa} °C⁻¹)</li>
      <li>Aislante: ${resultado.etiquetaAislante}</li>
      <li>Resistividad a 20 °C: ${formatearNumero(resultado.resistividad20, 5)} Ω·mm²/m</li>
      <li>Resistividad a ${resultado.temperaturaServicio} °C: ${formatearNumero(resultado.resistividadServicio, 5)} Ω·mm²/m</li>
    </ul>
    <p class="formula">Fórmulas: ${resultado.formula} ; ${resultado.formulaTemperatura}</p>
  `;
}

function formatearSeccion(valor) {
  return Number.isInteger(valor) ? String(valor) : String(valor);
}
