import cables from "../../data/cables.json" with { type: "json" };
import constantesArchivo from "../../data/constantes.json" with { type: "json" };
import { calcularCaidaTension } from "../calculos/caidaTension.js";
import { formatearNumero } from "../utils/format.js";

const constantes = {
  tensionMonofasica: 230,
  tensionTrifasica: 400,
  factorPotenciaPorDefecto: 1,
  caidaTensionIluminacion: 3,
  caidaTensionOtros: 5,
  seccionMinimaAluminio: 16,
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

export function renderCaidaTension(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Caída de tensión</h2>
        <p>Calcula la caída de tensión de una línea a partir de la intensidad, la longitud, la sección y el tipo de aislante.</p>
      </header>

      <form class="form-calculo" id="form-caida" novalidate>
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
          <span>Sección</span>
          <span class="campo-control">
            <select name="seccion" required></select>
            <span class="unidad">mm²</span>
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

        <p class="ayuda">El aislante fija la temperatura de servicio y, con ella, la conductividad γ. El XLPE (90 °C) produce algo más de caída que el PVC (70 °C). Iluminación propone 3 % y otros usos 5 % (ITC-BT-19).</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-caida" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-caida");
  const resultado = contenedor.querySelector("#resultado-caida");
  const campoTension = form.elements.tension;
  const campoCaida = form.elements.caidaMaxima;
  const campoSeccion = form.elements.seccion;

  rellenarSecciones(campoSeccion, "cobre");

  form.querySelectorAll('input[name="tipo"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      campoTension.value = tensionPorTipo[radio.value];
    });
  });

  form.querySelectorAll('input[name="material"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      rellenarSecciones(campoSeccion, radio.value);
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
      seccion: form.elements.seccion.value,
      material: form.elements.material.value,
      aislante: form.elements.aislante.value,
      uso: form.elements.uso.value,
      caidaMaxima: form.elements.caidaMaxima.value,
      factorPotencia: form.elements.factorPotencia.value,
    };

    mostrarResultado(resultado, calcularCaidaTension(datos));
  });
}

function rellenarSecciones(select, material) {
  const minima = material === "aluminio" ? constantes.seccionMinimaAluminio : 0;
  const secciones = cables.secciones.filter((seccion) => seccion >= minima);
  const actual = Number(select.value);
  select.innerHTML = secciones
    .map((seccion) => `<option value="${seccion}">${formatearSeccion(seccion)}</option>`)
    .join("");

  if (secciones.includes(actual)) {
    select.value = String(actual);
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

  const etiquetaTipo = resultado.tipo === "trifasica" ? "trifásica" : "monofásica";
  const veredicto = resultado.cumple
    ? `Cumple el máximo de ${formatearNumero(resultado.caidaMaxima)} %.`
    : `No cumple el máximo de ${formatearNumero(resultado.caidaMaxima)} %.`;

  contenedor.className = resultado.cumple ? "resultado" : "resultado resultado-aviso";
  contenedor.innerHTML = `
    <h3>Resultado</h3>
    <p class="resultado-principal">
      <span>Caída de tensión</span>
      <strong>${formatearNumero(resultado.caidaPorcentaje)} %</strong>
    </p>
    <p class="formula">${veredicto}</p>
    <ul class="resultado-detalle">
      <li>Caída absoluta: ${formatearNumero(resultado.caidaVoltios)} V</li>
      <li>Aislante: ${resultado.etiquetaAislante}</li>
      <li>Conductividad a ${resultado.temperaturaServicio} °C: γ = ${formatearNumero(resultado.gamma)} m/(Ω·mm²)</li>
    </ul>
    <p class="formula">Fórmula ${etiquetaTipo}: ${resultado.formula}</p>
  `;
}

function formatearSeccion(valor) {
  return Number.isInteger(valor) ? String(valor) : String(valor);
}
