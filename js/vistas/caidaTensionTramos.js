import cables from "../../data/cables.json" with { type: "json" };
import constantesArchivo from "../../data/constantes.json" with { type: "json" };
import { calcularCaidaTensionTramos } from "../calculos/caidaTensionTramos.js";
import { formatearNumero } from "../utils/format.js";

const constantes = {
  tensionMonofasica: 230,
  tensionTrifasica: 400,
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

export function renderCaidaTensionTramos(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Caída de tensión por tramos</h2>
        <p>Suma la caída de cada tramo a partir de la potencia que transporta, su longitud y su sección.</p>
      </header>

      <form class="form-calculo" id="form-caida-tramos" novalidate>
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

        <fieldset class="campo">
          <legend>Tramos</legend>
          <div class="lista-tramos" id="lista-tramos"></div>
          <button type="button" class="secundario" id="anadir-tramo">Añadir tramo</button>
        </fieldset>

        <p class="ayuda">El tramo 1 es el más cercano al origen y el último, el extremo de la línea. La potencia que indicas es la que se aplica en ese tramo. La que recorre el conductor es esa más la de todos los tramos siguientes. El aislante fija γ. En monofásico U es la tensión de fase; en trifásico, la tensión entre fases. Iluminación propone 3 % y otros usos 5 % (ITC-BT-19).</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-caida-tramos" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-caida-tramos");
  const resultado = contenedor.querySelector("#resultado-caida-tramos");
  const lista = contenedor.querySelector("#lista-tramos");
  const tramos = [{ potencia: "", longitud: "", seccion: "2.5" }];

  pintarTramos(lista, tramos, form.elements.material.value);

  contenedor.querySelector("#anadir-tramo").addEventListener("click", () => {
    guardarTramos(lista, tramos);
    tramos.push({ potencia: "", longitud: "", seccion: tramos.at(-1)?.seccion ?? "2.5" });
    pintarTramos(lista, tramos, form.elements.material.value);
  });

  lista.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-quitar]");
    if (!boton || tramos.length === 1) {
      return;
    }
    guardarTramos(lista, tramos);
    tramos.splice(Number(boton.dataset.quitar), 1);
    pintarTramos(lista, tramos, form.elements.material.value);
  });

  form.querySelectorAll('input[name="tipo"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      form.elements.tension.value = tensionPorTipo[radio.value];
    });
  });

  form.querySelectorAll('input[name="material"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      guardarTramos(lista, tramos);
      pintarTramos(lista, tramos, radio.value);
    });
  });

  form.querySelectorAll('input[name="uso"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      form.elements.caidaMaxima.value = caidaPorUso[radio.value];
    });
  });

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    guardarTramos(lista, tramos);

    mostrarResultado(
      resultado,
      calcularCaidaTensionTramos({
        tipo: form.elements.tipo.value,
        tension: form.elements.tension.value,
        material: form.elements.material.value,
        aislante: form.elements.aislante.value,
        uso: form.elements.uso.value,
        caidaMaxima: form.elements.caidaMaxima.value,
        tramos,
      }),
    );
  });
}

function pintarTramos(lista, tramos, material) {
  const opciones = opcionesSeccion(material);
  lista.innerHTML = tramos
    .map(
      (tramo, indice) => `
        <div class="tramo-item">
          <label class="campo">
            <span>Tramo ${indice + 1} — potencia aplicada</span>
            <span class="campo-control">
              <input type="number" data-potencia min="0" step="any" value="${escapar(tramo.potencia)}" required />
              <span class="unidad">W</span>
            </span>
          </label>
          <label class="campo">
            <span>Longitud</span>
            <span class="campo-control">
              <input type="number" data-longitud min="0" step="any" value="${escapar(tramo.longitud)}" required />
              <span class="unidad">m</span>
            </span>
          </label>
          <label class="campo">
            <span>Sección</span>
            <span class="campo-control">
              <select data-seccion required>${opciones}</select>
              <span class="unidad">mm²</span>
            </span>
          </label>
          <button type="button" class="secundario" data-quitar="${indice}" ${tramos.length === 1 ? "disabled" : ""}>Quitar</button>
        </div>
      `,
    )
    .join("");

  lista.querySelectorAll("[data-seccion]").forEach((select, indice) => {
    const secciones = seccionesDe(material);
    if (secciones.some((seccion) => Math.abs(seccion - Number(tramos[indice].seccion)) < 1e-9)) {
      select.value = String(Number(tramos[indice].seccion));
    }
  });
}

function guardarTramos(lista, tramos) {
  lista.querySelectorAll(".tramo-item").forEach((fila, indice) => {
    tramos[indice] = {
      potencia: fila.querySelector("[data-potencia]").value,
      longitud: fila.querySelector("[data-longitud]").value,
      seccion: fila.querySelector("[data-seccion]").value,
    };
  });
}

function opcionesSeccion(material) {
  return seccionesDe(material)
    .map((seccion) => `<option value="${seccion}">${formatearSeccion(seccion)}</option>`)
    .join("");
}

function seccionesDe(material) {
  const minima = material === "aluminio" ? constantes.seccionMinimaAluminio : 0;
  return cables.secciones.filter((seccion) => seccion >= minima);
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
  const detalleTramos = resultado.tramos
    .map(
      (tramo, indice) =>
        `<li>Tramo ${indice + 1}: aplicada ${formatearNumero(tramo.potenciaAplicada)} W, transportada ${formatearNumero(tramo.potencia)} W, ${formatearNumero(tramo.longitud)} m, ${formatearSeccion(tramo.seccion)} mm² → ${formatearNumero(tramo.caidaVoltios)} V</li>`,
    )
    .join("");

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
      ${detalleTramos}
      <li>Aislante: ${resultado.etiquetaAislante}</li>
      <li>Conductividad a ${resultado.temperaturaServicio} °C: γ = ${formatearNumero(resultado.gamma)} m/(Ω·mm²)</li>
    </ul>
    <p class="formula">Fórmula ${etiquetaTipo}: ${resultado.formula}</p>
  `;
}

function formatearSeccion(valor) {
  return String(valor);
}

function escapar(valor) {
  return String(valor).replace(/"/g, "&quot;");
}
