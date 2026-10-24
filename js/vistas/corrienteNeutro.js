import { calcularCorrienteNeutro } from "../calculos/corrienteNeutro.js";
import { formatearNumero } from "../utils/format.js";

export function renderCorrienteNeutro(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Corriente de neutro</h2>
        <p>Calcula la corriente del neutro a partir de las intensidades de las tres fases.</p>
      </header>

      <form class="form-calculo" id="form-corriente-neutro" novalidate>
        <label class="campo">
          <span>Intensidad L1</span>
          <span class="campo-control">
            <input type="number" name="intensidadL1" min="0" step="any" required />
            <span class="unidad">A</span>
          </span>
        </label>

        <label class="campo">
          <span>Intensidad L2</span>
          <span class="campo-control">
            <input type="number" name="intensidadL2" min="0" step="any" required />
            <span class="unidad">A</span>
          </span>
        </label>

        <label class="campo">
          <span>Intensidad L3</span>
          <span class="campo-control">
            <input type="number" name="intensidadL3" min="0" step="any" required />
            <span class="unidad">A</span>
          </span>
        </label>

        <p class="ayuda">Supone las tres corrientes desfasadas 120° y con el mismo factor de potencia. Si las fases están equilibradas, la corriente de neutro es cero.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-corriente-neutro" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-corriente-neutro");
  const resultado = contenedor.querySelector("#resultado-corriente-neutro");

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = {
      intensidadL1: form.elements.intensidadL1.value,
      intensidadL2: form.elements.intensidadL2.value,
      intensidadL3: form.elements.intensidadL3.value,
    };

    mostrarResultado(resultado, calcularCorrienteNeutro(datos));
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
      <span>Corriente de neutro</span>
      <strong>${formatearNumero(resultado.corrienteNeutro)} A</strong>
    </p>
    <ul class="resultado-detalle">
      <li>L1: ${formatearNumero(resultado.intensidadL1)} A</li>
      <li>L2: ${formatearNumero(resultado.intensidadL2)} A</li>
      <li>L3: ${formatearNumero(resultado.intensidadL3)} A</li>
    </ul>
    <p class="formula">Fórmula: ${resultado.formula}</p>
  `;
}
