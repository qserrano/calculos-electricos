import constantesArchivo from "../../data/constantes.json" with { type: "json" };
import { calcularPotenciaActivaReactivaAparente } from "../calculos/potenciaActivaReactivaAparente.js";
import { formatearNumero } from "../utils/format.js";

const constantes = {
  tensionMonofasica: 230,
  tensionTrifasica: 400,
  factorPotenciaPorDefecto: 1,
  ...constantesArchivo,
};

const tensionPorTipo = {
  monofasica: constantes.tensionMonofasica,
  trifasica: constantes.tensionTrifasica,
};

export function renderPotenciaActivaReactivaAparente(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Potencia activa, reactiva y aparente</h2>
        <p>A partir de la intensidad y del cos φ, calcula P, Q y S según el tipo de suministro.</p>
      </header>

      <form class="form-calculo" id="form-potencias" novalidate>
        <fieldset class="campo">
          <legend>Tipo de suministro</legend>
          <div class="opciones">
            <label>
              <input type="radio" name="tipo" value="monofasica" checked />
              Monofásica
            </label>
            <label>
              <input type="radio" name="tipo" value="trifasica" />
              Trifásica
            </label>
          </div>
        </fieldset>

        <label class="campo">
          <span>Intensidad</span>
          <span class="campo-control">
            <input type="number" name="intensidad" min="0" step="any" required />
            <span class="unidad">A</span>
          </span>
        </label>

        <label class="campo">
          <span>Tensión</span>
          <span class="campo-control">
            <input type="number" name="tension" min="0" step="any" value="${constantes.tensionMonofasica}" required />
            <span class="unidad">V</span>
          </span>
        </label>

        <label class="campo">
          <span>Factor de potencia (cos φ)</span>
          <input type="number" name="factorPotencia" min="0.01" max="1" step="0.01" value="${constantes.factorPotenciaPorDefecto}" required />
        </label>

        <p class="ayuda">P es la potencia activa (W), Q la reactiva (var) y S la aparente (VA). sen φ = √(1 − cos² φ). Al cambiar el tipo se propone 230 V o 400 V; puedes ajustarlo. Q se obtiene en valor absoluto (carga inductiva).</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-potencias" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-potencias");
  const resultado = contenedor.querySelector("#resultado-potencias");
  const campoTension = form.elements.tension;

  form.querySelectorAll('input[name="tipo"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      campoTension.value = tensionPorTipo[radio.value];
    });
  });

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = {
      intensidad: form.elements.intensidad.value,
      tipo: form.elements.tipo.value,
      tension: form.elements.tension.value,
      factorPotencia: form.elements.factorPotencia.value,
    };

    mostrarResultado(resultado, calcularPotenciaActivaReactivaAparente(datos));
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

  const etiquetaTipo = resultado.tipo === "trifasica" ? "trifásica" : "monofásica";

  contenedor.className = "resultado";
  contenedor.innerHTML = `
    <h3>Resultado</h3>
    <p class="resultado-principal">
      <span>Potencia activa (P)</span>
      <strong>${formatearNumero(resultado.activa)} W</strong>
    </p>
    <p class="resultado-principal">
      <span>Potencia reactiva (Q)</span>
      <strong>${formatearNumero(resultado.reactiva)} var</strong>
    </p>
    <p class="resultado-principal">
      <span>Potencia aparente (S)</span>
      <strong>${formatearNumero(resultado.aparente)} VA</strong>
    </p>
    <ul class="resultado-detalle">
      <li>cos φ = ${formatearNumero(resultado.cosPhi, 4)}</li>
      <li>sen φ = ${formatearNumero(resultado.senPhi, 4)}</li>
    </ul>
    <p class="formula">Fórmulas ${etiquetaTipo}:</p>
    <ul class="resultado-detalle">
      ${resultado.formula.map((formula) => `<li>${formula}</li>`).join("")}
    </ul>
  `;
}
