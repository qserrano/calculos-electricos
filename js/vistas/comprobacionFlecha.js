import { calcularComprobacionFlecha } from "../calculos/comprobacionFlecha.js";
import { formatearNumero } from "../utils/format.js";

export function renderComprobacionFlecha(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Comprobación de flecha</h2>
        <p>Calcula el factor entre la flecha medida y la teórica, y el porcentaje de desviación respecto de 1.</p>
      </header>

      <form class="form-calculo" id="form-flecha" novalidate>
        <label class="campo">
          <span>Flecha medida</span>
          <span class="campo-control">
            <input type="number" name="flechaMedida" min="0" step="any" required />
            <span class="unidad">m</span>
          </span>
        </label>

        <label class="campo">
          <span>Flecha teórica</span>
          <span class="campo-control">
            <input type="number" name="flechaTeorica" min="0" step="any" required />
            <span class="unidad">m</span>
          </span>
        </label>

        <p class="ayuda">Si el factor vale 1, la flecha medida coincide con la teórica. Por encima de 1 la flecha real es mayor; por debajo, menor.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-flecha" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-flecha");
  const resultado = contenedor.querySelector("#resultado-flecha");

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = {
      flechaMedida: form.elements.flechaMedida.value,
      flechaTeorica: form.elements.flechaTeorica.value,
    };

    mostrarResultado(resultado, calcularComprobacionFlecha(datos));
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
      <span>Factor de comprobación de flecha</span>
      <strong>${formatearNumero(resultado.factor, 4)}</strong>
    </p>
    <p class="resultado-principal">
      <span>Porcentaje de desviación de flecha</span>
      <strong>${formatearConSigno(resultado.desviacionPorcentaje)} %</strong>
    </p>
    <ul class="resultado-detalle">
      <li>Flecha medida: ${formatearNumero(resultado.flechaMedida, 3)} m</li>
      <li>Flecha teórica: ${formatearNumero(resultado.flechaTeorica, 3)} m</li>
    </ul>
    <p class="formula">Fórmulas: ${resultado.formulaFactor} ; ${resultado.formulaDesviacion}</p>
  `;
}

function formatearConSigno(valor) {
  const texto = formatearNumero(valor);
  return valor > 0 ? `+${texto}` : texto;
}
