import { calcularPrevisionCargas } from "../calculos/previsionCargas.js";
import { formatearNumero } from "../utils/format.js";

export function renderPrevisionCargas(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Previsión de cargas</h2>
        <p>Calcula la previsión de un edificio de viviendas según la ITC-BT-10: viviendas, servicios generales y locales comerciales.</p>
      </header>

      <form class="form-calculo" id="form-prevision" novalidate>
        <label class="campo">
          <span>Viviendas con electrificación básica (5.750 W)</span>
          <input type="number" name="viviendasBasicas" min="0" step="1" value="0" />
        </label>

        <label class="campo">
          <span>Viviendas con electrificación elevada (9.200 W)</span>
          <input type="number" name="viviendasElevadas" min="0" step="1" value="0" />
        </label>

        <label class="campo">
          <span>Servicios generales</span>
          <span class="campo-control">
            <input type="number" name="potenciaServicios" min="0" step="any" value="0" />
            <span class="unidad">W</span>
          </span>
        </label>

        <fieldset class="campo">
          <legend>Tarifa nocturna</legend>
          <div class="opciones">
            <label>
              <input type="radio" name="tarifaNocturna" value="no" checked />
              No
            </label>
            <label>
              <input type="radio" name="tarifaNocturna" value="si" />
              Sí (Cs = n)
            </label>
          </div>
        </fieldset>

        <fieldset class="campo">
          <legend>Locales comerciales</legend>
          <div id="lista-locales"></div>
          <button type="button" class="secundario" id="anadir-local">Añadir local</button>
        </fieldset>

        <p class="ayuda">La carga de viviendas es Cs · Pmedia. Cada local se calcula con 100 W/m² y un mínimo de 3.450 W, sin simultaneidad. Los servicios generales se suman tal cual (ascensor, alumbrado, grupo de presión, etc.).</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-prevision" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-prevision");
  const resultado = contenedor.querySelector("#resultado-prevision");
  const listaLocales = contenedor.querySelector("#lista-locales");
  const superficies = [];

  pintarLocales(listaLocales, superficies);

  contenedor.querySelector("#anadir-local").addEventListener("click", () => {
    guardarSuperficies(listaLocales, superficies);
    superficies.push("");
    pintarLocales(listaLocales, superficies);
  });

  listaLocales.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-quitar]");
    if (!boton) {
      return;
    }
    guardarSuperficies(listaLocales, superficies);
    superficies.splice(Number(boton.dataset.quitar), 1);
    pintarLocales(listaLocales, superficies);
  });

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    guardarSuperficies(listaLocales, superficies);

    const datos = {
      viviendasBasicas: form.elements.viviendasBasicas.value,
      viviendasElevadas: form.elements.viviendasElevadas.value,
      potenciaServicios: form.elements.potenciaServicios.value,
      superficiesLocales: superficies,
      tarifaNocturna: form.elements.tarifaNocturna.value,
    };

    mostrarResultado(resultado, calcularPrevisionCargas(datos));
  });
}

function pintarLocales(lista, superficies) {
  if (superficies.length === 0) {
    lista.innerHTML = `<p class="ayuda">No hay locales. Añade uno si el edificio los tiene.</p>`;
    return;
  }

  lista.innerHTML = superficies
    .map(
      (superficie, indice) => `
        <div class="local-item">
          <label class="campo">
            <span>Local ${indice + 1} — superficie útil</span>
            <span class="campo-control">
              <input type="number" data-superficie min="0" step="any" value="${superficie}" />
              <span class="unidad">m²</span>
            </span>
          </label>
          <button type="button" class="secundario" data-quitar="${indice}">Quitar</button>
        </div>
      `,
    )
    .join("");
}

function guardarSuperficies(lista, superficies) {
  const campos = [...lista.querySelectorAll("[data-superficie]")];
  campos.forEach((campo, indice) => {
    superficies[indice] = campo.value;
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

  const detalleLocales =
    resultado.locales.length === 0
      ? "<li>Locales comerciales: 0 W</li>"
      : resultado.locales
          .map(
            (local, indice) =>
              `<li>Local ${indice + 1}: ${formatearNumero(local.superficie)} m² → ${formatearPotencia(local.potencia)} W${local.aplicaMinimo ? " (mínimo 3.450 W)" : ""}</li>`,
          )
          .join("");

  contenedor.className = "resultado";
  contenedor.innerHTML = `
    <h3>Resultado</h3>
    <p class="resultado-principal">
      <span>Previsión total</span>
      <strong>${formatearNumero(resultado.potenciaTotalKw, 3)} kW</strong>
    </p>
    <ul class="resultado-detalle">
      <li>Viviendas: ${resultado.nBasicas} básicas + ${resultado.nElevadas} elevadas = ${resultado.nViviendas}</li>
      <li>Pmedia: ${formatearPotencia(resultado.potenciaMedia)} W · Cs = ${formatearNumero(resultado.coeficiente)}${resultado.tarifaNocturna ? " (tarifa nocturna)" : ""}</li>
      <li>Carga de viviendas: ${formatearPotencia(resultado.potenciaViviendas)} W</li>
      <li>Servicios generales: ${formatearPotencia(resultado.potenciaServicios)} W</li>
      ${detalleLocales}
      <li>Carga de locales: ${formatearPotencia(resultado.potenciaLocales)} W</li>
      <li>Total: ${formatearPotencia(resultado.potenciaTotal)} W</li>
    </ul>
    <p class="formula">Fórmula: ${resultado.formula}</p>
    <p class="ayuda">${resultado.referencia}</p>
  `;
}

function formatearPotencia(valor) {
  return Number(valor).toLocaleString("es-ES", { maximumFractionDigits: 2 });
}
