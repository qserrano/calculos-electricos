import constantesArchivo from "../../data/constantes.json" with { type: "json" };
import { calcularIntensidad } from "../calculos/intensidad.js";
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

export function renderIntensidad(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Intensidad conocida la potencia</h2>
        <p>A partir de la potencia en vatios, calcula la intensidad según el tipo de suministro.</p>
      </header>

      <form class="form-calculo" id="form-intensidad" novalidate>
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
          <span>Potencia</span>
          <span class="campo-control">
            <input type="number" name="potencia" min="0" step="any" required />
            <span class="unidad">W</span>
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

        <p class="ayuda">Si no conoces el factor de potencia, déjalo en 1 (carga resistiva). Al cambiar el tipo se propone 230 V o 400 V; puedes ajustarlo.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-intensidad" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-intensidad");
  const resultado = contenedor.querySelector("#resultado-intensidad");
  const campoTension = form.elements.tension;

  form.querySelectorAll('input[name="tipo"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      campoTension.value = tensionPorTipo[radio.value];
    });
  });

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = {
      potencia: form.elements.potencia.value,
      tipo: form.elements.tipo.value,
      tension: form.elements.tension.value,
      factorPotencia: form.elements.factorPotencia.value,
    };

    mostrarResultado(resultado, calcularIntensidad(datos));
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
      <span>Intensidad</span>
      <strong>${formatearNumero(resultado.intensidad)} A</strong>
    </p>
    <p class="formula">Fórmula ${etiquetaTipo}: ${resultado.formula}</p>
  `;
}
