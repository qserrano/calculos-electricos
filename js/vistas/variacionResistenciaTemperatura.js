import cables from "../../data/cables.json" with { type: "json" };
import { calcularVariacionResistenciaTemperatura } from "../calculos/variacionResistenciaTemperatura.js";
import { formatearNumero } from "../utils/format.js";

const alfaCobre = cables.coeficienteTemperatura.cobre;
const alfaAluminio = cables.coeficienteTemperatura.aluminio;

export function renderVariacionResistenciaTemperatura(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Variación de la resistencia con la temperatura</h2>
        <p>Calcula la resistencia a otra temperatura a partir de una resistencia conocida y del material del conductor.</p>
      </header>

      <form class="form-calculo" id="form-variacion-resistencia" novalidate>
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

        <label class="campo">
          <span>Resistencia conocida</span>
          <span class="campo-control">
            <input type="number" name="resistencia" min="0" step="any" required />
            <span class="unidad">Ω</span>
          </span>
        </label>

        <label class="campo">
          <span>Temperatura de esa resistencia</span>
          <span class="campo-control">
            <input type="number" name="temperaturaInicial" step="any" value="20" required />
            <span class="unidad">°C</span>
          </span>
        </label>

        <label class="campo">
          <span>Temperatura final</span>
          <span class="campo-control">
            <input type="number" name="temperaturaFinal" step="any" value="70" required />
            <span class="unidad">°C</span>
          </span>
        </label>

        <p class="ayuda">α está referido a 20 °C. Cobre: ${alfaCobre} °C⁻¹. Aluminio: ${alfaAluminio} °C⁻¹. Si la resistencia no está medida a 20 °C, el cálculo la lleva primero a esa referencia y después a la temperatura final.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-variacion-resistencia" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-variacion-resistencia");
  const resultado = contenedor.querySelector("#resultado-variacion-resistencia");

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = {
      resistencia: form.elements.resistencia.value,
      temperaturaInicial: form.elements.temperaturaInicial.value,
      temperaturaFinal: form.elements.temperaturaFinal.value,
      material: form.elements.material.value,
    };

    mostrarResultado(resultado, calcularVariacionResistenciaTemperatura(datos));
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

  const etiquetaMaterial = resultado.material === "aluminio" ? "aluminio" : "cobre";
  const detalleReferencia =
    resultado.temperaturaInicial === 20
      ? ""
      : `<li>Resistencia a 20 °C: ${formatearNumero(resultado.resistencia20, 4)} Ω</li>`;

  contenedor.className = "resultado";
  contenedor.innerHTML = `
    <h3>Resultado</h3>
    <p class="resultado-principal">
      <span>Resistencia a ${formatearTemperatura(resultado.temperaturaFinal)} °C</span>
      <strong>${formatearNumero(resultado.resistenciaFinal, 4)} Ω</strong>
    </p>
    <ul class="resultado-detalle">
      <li>Resistencia a ${formatearTemperatura(resultado.temperaturaInicial)} °C: ${formatearNumero(resultado.resistenciaInicial, 4)} Ω</li>
      ${detalleReferencia}
      <li>Variación: ${formatearVariacion(resultado.variacion, 4)} Ω (${formatearVariacion(resultado.variacionPorcentaje, 2)} %)</li>
      <li>Factor: ${formatearNumero(resultado.factor, 4)}</li>
      <li>Material: ${etiquetaMaterial} (α = ${resultado.alfa} °C⁻¹)</li>
    </ul>
    <p class="formula">Fórmula: ${resultado.formula}</p>
  `;
}

function formatearTemperatura(valor) {
  return String(valor);
}

function formatearVariacion(valor, decimales) {
  const texto = formatearNumero(valor, decimales);
  return valor > 0 ? `+${texto}` : texto;
}
