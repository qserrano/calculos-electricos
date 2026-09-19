import constantesArchivo from "../../data/constantes.json" with { type: "json" };
import { calcularSeccionConductor } from "../calculos/seccionConductor.js";
import { formatearNumero } from "../utils/format.js";

const constantes = {
  tensionMonofasica: 230,
  tensionTrifasica: 400,
  factorPotenciaPorDefecto: 1,
  caidaTensionIluminacion: 3,
  caidaTensionOtros: 5,
  ...constantesArchivo,
};

const tensionPorTipo = {
  monofasica: constantes.tensionMonofasica,
  trifasica: constantes.tensionTrifasica,
};

const caidaPorUso = {
  iluminacion: constantes.caidaTensionIluminacion,
  otros: constantes.caidaTensionOtros,
};

export function renderSeccionConductor(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Sección de conductor</h2>
        <p>Calcula la sección comercial a partir de la intensidad, la longitud y la caída de tensión máxima, y comprueba la intensidad admisible.</p>
      </header>

      <form class="form-calculo" id="form-seccion" novalidate>
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
          <legend>Uso de la línea</legend>
          <div class="opciones">
            <label>
              <input type="radio" name="uso" value="iluminacion" />
              Iluminación
            </label>
            <label>
              <input type="radio" name="uso" value="otros" checked />
              Otros usos
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
          <span>Longitud</span>
          <span class="campo-control">
            <input type="number" name="longitud" min="0" step="any" required />
            <span class="unidad">m</span>
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
          <span>Caída de tensión máxima</span>
          <span class="campo-control">
            <input type="number" name="caidaMaxima" min="0" max="100" step="any" value="${constantes.caidaTensionOtros}" required />
            <span class="unidad">%</span>
          </span>
        </label>

        <label class="campo">
          <span>Factor de potencia (cos φ)</span>
          <input type="number" name="factorPotencia" min="0.01" max="1" step="0.01" value="${constantes.factorPotenciaPorDefecto}" required />
        </label>

        <p class="ayuda">Iluminación propone 3 % y otros usos 5 % (ITC-BT-19). Al cambiar el tipo se propone 230 V o 400 V. La tabla de intensidad es orientativa (PVC 70 °C, en tubo), sin factores de agrupamiento ni temperatura.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-seccion" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-seccion");
  const resultado = contenedor.querySelector("#resultado-seccion");
  const campoTension = form.elements.tension;
  const campoCaida = form.elements.caidaMaxima;

  form.querySelectorAll('input[name="tipo"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      campoTension.value = tensionPorTipo[radio.value];
    });
  });

  form.querySelectorAll('input[name="uso"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      campoCaida.value = caidaPorUso[radio.value];
    });
  });

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = {
      intensidad: form.elements.intensidad.value,
      tipo: form.elements.tipo.value,
      tension: form.elements.tension.value,
      longitud: form.elements.longitud.value,
      material: form.elements.material.value,
      uso: form.elements.uso.value,
      caidaMaxima: form.elements.caidaMaxima.value,
      factorPotencia: form.elements.factorPotencia.value,
    };

    mostrarResultado(resultado, calcularSeccionConductor(datos));
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
  const etiquetaMaterial = resultado.material === "aluminio" ? "aluminio" : "cobre";

  contenedor.className = "resultado";
  contenedor.innerHTML = `
    <h3>Resultado</h3>
    <p class="resultado-principal">
      <span>Sección</span>
      <strong>${formatearSeccion(resultado.seccion)} mm²</strong>
    </p>
    <p class="formula">Criterio que impone la sección: ${resultado.criterio}.</p>
    <ul class="resultado-detalle">
      <li>Sección por caída de tensión: ${formatearNumero(resultado.seccionPorCaida)} mm²</li>
      <li>Sección mínima del uso (${etiquetaMaterial}): ${formatearSeccion(resultado.seccionMinima)} mm²</li>
      <li>Intensidad admisible de ${formatearSeccion(resultado.seccion)} mm²: ${resultado.intensidadMaxima} A</li>
      <li>Caída de tensión con esa sección: ${formatearNumero(resultado.caidaRealPorcentaje)} % (${formatearNumero(resultado.caidaRealVoltios)} V)</li>
    </ul>
    <p class="formula">Fórmula ${etiquetaTipo}: ${resultado.formula}</p>
    <p class="ayuda">${resultado.referencia}</p>
  `;
}

function formatearSeccion(valor) {
  return Number.isInteger(valor) ? String(valor) : String(valor);
}
