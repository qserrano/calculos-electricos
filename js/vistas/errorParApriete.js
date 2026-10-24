import { calcularErrorParApriete } from "../calculos/errorParApriete.js";
import { formatearNumero } from "../utils/format.js";

export function renderErrorParApriete(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Error porcentual del par de apriete</h2>
        <p>Compara el momento medido con el momento nominal y expresa la diferencia en porcentaje.</p>
      </header>

      <form class="form-calculo" id="form-par-apriete" novalidate>
        <label class="campo">
          <span>Momento medido</span>
          <span class="campo-control">
            <input type="number" name="momentoMedido" min="0" step="any" required />
            <span class="unidad">N·m</span>
          </span>
        </label>

        <label class="campo">
          <span>Momento nominal</span>
          <span class="campo-control">
            <input type="number" name="momentoNominal" min="0" step="any" required />
            <span class="unidad">N·m</span>
          </span>
        </label>

        <p class="ayuda">Un resultado positivo indica que el par medido supera al nominal. Un resultado negativo indica que queda por debajo.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-par-apriete" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-par-apriete");
  const resultado = contenedor.querySelector("#resultado-par-apriete");

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = {
      momentoMedido: form.elements.momentoMedido.value,
      momentoNominal: form.elements.momentoNominal.value,
    };

    mostrarResultado(resultado, calcularErrorParApriete(datos));
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
      <span>Error porcentual</span>
      <strong>${formatearConSigno(resultado.errorPorcentaje)} %</strong>
    </p>
    <ul class="resultado-detalle">
      <li>Diferencia: ${formatearConSigno(resultado.diferencia)} N·m</li>
      <li>Momento medido: ${formatearNumero(resultado.momentoMedido)} N·m</li>
      <li>Momento nominal: ${formatearNumero(resultado.momentoNominal)} N·m</li>
    </ul>
    <p class="formula">Fórmula: ${resultado.formula}</p>
  `;
}

function formatearConSigno(valor) {
  const texto = formatearNumero(valor);
  return valor > 0 ? `+${texto}` : texto;
}
