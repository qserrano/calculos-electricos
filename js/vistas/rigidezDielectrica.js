import { calcularRigidezDielectrica } from "../calculos/rigidezDielectrica.js";
import { formatearNumero } from "../utils/format.js";

export function renderRigidezDielectrica(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Rigidez dieléctrica del aislamiento</h2>
        <p>Calcula el gradiente eléctrico en el aislante a partir de la tensión de rotura y de su espesor.</p>
      </header>

      <form class="form-calculo" id="form-rigidez" novalidate>
        <label class="campo">
          <span>Tensión de rotura</span>
          <span class="campo-control">
            <input type="number" name="tension" min="0" step="any" required />
            <span class="unidad">V</span>
          </span>
        </label>

        <label class="campo">
          <span>Espesor del aislante</span>
          <span class="campo-control">
            <input type="number" name="espesor" min="0" step="any" required />
            <span class="unidad">mm</span>
          </span>
        </label>

        <p class="ayuda">La tensión de rotura es la tensión a la que el aislante se perfora. Puedes indicar cualquier valor, en voltios. La rigidez dieléctrica es esa tensión dividida por el espesor.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-rigidez" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-rigidez");
  const resultado = contenedor.querySelector("#resultado-rigidez");

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = {
      tension: form.elements.tension.value,
      espesor: form.elements.espesor.value,
    };

    mostrarResultado(resultado, calcularRigidezDielectrica(datos));
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
      <span>Rigidez dieléctrica</span>
      <strong>${formatearNumero(resultado.rigidez)} V/mm</strong>
    </p>
    <ul class="resultado-detalle">
      <li>Equivalente: ${formatearNumero(resultado.rigidezKilovoltios, 4)} kV/mm</li>
      <li>Tensión de rotura: ${formatearNumero(resultado.tension)} V</li>
      <li>Espesor del aislante: ${formatearNumero(resultado.espesor, 3)} mm</li>
    </ul>
    <p class="formula">Fórmula: ${resultado.formula}</p>
  `;
}
