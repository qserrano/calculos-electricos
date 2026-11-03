import { calcularPrevisionCargas } from "../calculos/previsionCargas.js";
import { formatearNumero } from "../utils/format.js";

export function renderPrevisionCargas(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Previsión de cargas</h2>
        <p>Calcula la previsión de un edificio de viviendas según la ITC-BT-10: viviendas, servicios comunes, locales comerciales, garaje y recarga de vehículos eléctricos.</p>
      </header>

      <form class="form-calculo" id="form-prevision" novalidate>
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

        <label class="campo">
          <span>Viviendas con electrificación básica (5.750 W)</span>
          <input type="number" name="viviendasBasicas" min="0" step="1" value="0" />
        </label>

        <label class="campo">
          <span>Viviendas con electrificación elevada (9.200 W)</span>
          <input type="number" name="viviendasElevadas" min="0" step="1" value="0" />
        </label>

        <fieldset class="campo">
          <legend>Servicios comunes</legend>
          <div id="lista-receptores"></div>
          <button type="button" class="secundario" id="anadir-receptor">Añadir receptor</button>
        </fieldset>

        <fieldset class="campo">
          <legend>Locales comerciales</legend>
          <div id="lista-locales"></div>
          <button type="button" class="secundario" id="anadir-local">Añadir local</button>
        </fieldset>

        <fieldset class="campo">
          <legend>Garaje</legend>
          <div id="lista-garajes"></div>
          <button type="button" class="secundario" id="anadir-garaje">Añadir garaje</button>
        </fieldset>

        <fieldset class="campo">
          <legend>Recarga de vehículos eléctricos</legend>
          <label class="campo">
            <span>Número de estaciones de recarga</span>
            <input type="number" name="estacionesRecarga" min="0" step="1" value="0" />
          </label>
        </fieldset>

        <p class="ayuda">La carga de viviendas es Cs · Pmedia. En los servicios comunes, el receptor de mayor potencia se multiplica por 1,25 (ITC-BT-47) y después se suman todas las potencias. Cada local se calcula con 100 W/m² y un mínimo de 3.450 W, sin simultaneidad. El garaje se calcula con 10 W/m² si la ventilación es natural y con 20 W/m² si es forzada, también con un mínimo de 3.450 W. La recarga toma, de la Tabla 2 de la ITC-BT-52, la potencia instalada del circuito que cubre el número de estaciones. A partir de 13 estaciones se añaden los circuitos necesarios.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-prevision" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-prevision");
  const resultado = contenedor.querySelector("#resultado-prevision");
  const listaReceptores = contenedor.querySelector("#lista-receptores");
  const listaLocales = contenedor.querySelector("#lista-locales");
  const listaGarajes = contenedor.querySelector("#lista-garajes");
  const receptores = [];
  const superficies = [];
  const garajes = [];

  pintarReceptores(listaReceptores, receptores);
  pintarLocales(listaLocales, superficies);
  pintarGarajes(listaGarajes, garajes);

  contenedor.querySelector("#anadir-receptor").addEventListener("click", () => {
    guardarReceptores(listaReceptores, receptores);
    receptores.push({ nombre: "", potencia: "" });
    pintarReceptores(listaReceptores, receptores);
  });

  listaReceptores.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-quitar]");
    if (!boton) {
      return;
    }
    guardarReceptores(listaReceptores, receptores);
    receptores.splice(Number(boton.dataset.quitar), 1);
    pintarReceptores(listaReceptores, receptores);
  });

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

  contenedor.querySelector("#anadir-garaje").addEventListener("click", () => {
    guardarGarajes(listaGarajes, garajes);
    garajes.push({ ventilacion: "natural", superficie: "" });
    pintarGarajes(listaGarajes, garajes);
  });

  listaGarajes.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-quitar]");
    if (!boton) {
      return;
    }
    guardarGarajes(listaGarajes, garajes);
    garajes.splice(Number(boton.dataset.quitar), 1);
    pintarGarajes(listaGarajes, garajes);
  });

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    guardarReceptores(listaReceptores, receptores);
    guardarSuperficies(listaLocales, superficies);
    guardarGarajes(listaGarajes, garajes);

    const datos = {
      viviendasBasicas: form.elements.viviendasBasicas.value,
      viviendasElevadas: form.elements.viviendasElevadas.value,
      receptores,
      superficiesLocales: superficies,
      garajes,
      estacionesRecarga: form.elements.estacionesRecarga.value,
      tarifaNocturna: form.elements.tarifaNocturna.value,
    };

    mostrarResultado(resultado, calcularPrevisionCargas(datos));
  });
}

function pintarReceptores(lista, receptores) {
  if (receptores.length === 0) {
    lista.innerHTML = `<p class="ayuda">No hay receptores. Añade ascensor, alumbrado, grupo de presión u otros servicios comunes.</p>`;
    return;
  }

  lista.innerHTML = receptores
    .map(
      (receptor, indice) => `
        <div class="receptor-item">
          <label class="campo">
            <span>Receptor ${indice + 1}</span>
            <input type="text" data-nombre value="${escapar(receptor.nombre)}" />
          </label>
          <label class="campo">
            <span>Potencia</span>
            <span class="campo-control">
              <input type="number" data-potencia min="0" step="any" value="${escapar(receptor.potencia)}" />
              <span class="unidad">W</span>
            </span>
          </label>
          <button type="button" class="secundario" data-quitar="${indice}">Quitar</button>
        </div>
      `,
    )
    .join("");
}

function guardarReceptores(lista, receptores) {
  const filas = [...lista.querySelectorAll(".receptor-item")];
  filas.forEach((fila, indice) => {
    receptores[indice] = {
      nombre: fila.querySelector("[data-nombre]").value,
      potencia: fila.querySelector("[data-potencia]").value,
    };
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

function pintarGarajes(lista, garajes) {
  if (garajes.length === 0) {
    lista.innerHTML = `<p class="ayuda">No hay garaje. Añade uno si el edificio lo tiene.</p>`;
    return;
  }

  lista.innerHTML = garajes
    .map(
      (garaje, indice) => `
        <div class="garaje-item">
          <label class="campo">
            <span>Garaje ${indice + 1}</span>
            <select data-ventilacion>
              <option value="natural" ${garaje.ventilacion === "forzada" ? "" : "selected"}>Ventilación natural (10 W/m²)</option>
              <option value="forzada" ${garaje.ventilacion === "forzada" ? "selected" : ""}>Ventilación forzada (20 W/m²)</option>
            </select>
          </label>
          <label class="campo">
            <span>Superficie</span>
            <span class="campo-control">
              <input type="number" data-superficie min="0" step="any" value="${escapar(garaje.superficie)}" />
              <span class="unidad">m²</span>
            </span>
          </label>
          <button type="button" class="secundario" data-quitar="${indice}">Quitar</button>
        </div>
      `,
    )
    .join("");
}

function guardarGarajes(lista, garajes) {
  const filas = [...lista.querySelectorAll(".garaje-item")];
  filas.forEach((fila, indice) => {
    garajes[indice] = {
      ventilacion: fila.querySelector("[data-ventilacion]").value,
      superficie: fila.querySelector("[data-superficie]").value,
    };
  });
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
      <ul>${resultado.errores.map((error) => `<li>${escapar(error)}</li>`).join("")}</ul>
    `;
    return;
  }

  const detalleReceptores =
    resultado.receptores.length === 0
      ? "<li>Servicios comunes: 0 W</li>"
      : resultado.receptores
          .map((receptor) => {
            const potencia = formatearPotencia(receptor.potencia);
            if (!receptor.mayor) {
              return `<li>${escapar(receptor.nombre)}: ${potencia} W</li>`;
            }
            return `<li>${escapar(receptor.nombre)}: ${potencia} W × ${formatearNumero(resultado.factorReceptorMayor)} = ${formatearPotencia(receptor.potenciaComputada)} W</li>`;
          })
          .join("") +
        `<li>Carga de servicios comunes: ${formatearPotencia(resultado.potenciaServicios)} W</li>`;

  const detalleLocales =
    resultado.locales.length === 0
      ? "<li>Locales comerciales: 0 W</li>"
      : resultado.locales
          .map(
            (local, indice) =>
              `<li>Local ${indice + 1}: ${formatearNumero(local.superficie)} m² → ${formatearPotencia(local.potencia)} W${local.aplicaMinimo ? " (mínimo 3.450 W)" : ""}</li>`,
          )
          .join("");

  const detalleGarajes =
    resultado.garajes.length === 0
      ? "<li>Garaje: 0 W</li>"
      : resultado.garajes
          .map((garaje, indice) => {
            const ventilacion = garaje.ventilacion === "forzada" ? "ventilación forzada" : "ventilación natural";
            return `<li>Garaje ${indice + 1}: ${formatearNumero(garaje.superficie)} m², ${ventilacion} (${garaje.densidad} W/m²) → ${formatearPotencia(garaje.potencia)} W${garaje.aplicaMinimo ? " (mínimo 3.450 W)" : ""}</li>`;
          })
          .join("");

  const detalleRecarga =
    resultado.nEstacionesRecarga === 0
      ? "<li>Recarga de vehículos eléctricos: 0 W</li>"
      : resultado.circuitosRecarga
          .map(
            (circuito, indice) =>
              `<li>${resultado.circuitosRecarga.length > 1 ? `Circuito de recarga ${indice + 1}` : "Recarga"}: ${circuito.estaciones} ${circuito.estaciones === 1 ? "estación" : "estaciones"} → ${circuito.corriente} A, ${formatearPotencia(circuito.potencia)} W</li>`,
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
      ${detalleReceptores}
      ${detalleLocales}
      <li>Carga de locales: ${formatearPotencia(resultado.potenciaLocales)} W</li>
      ${detalleGarajes}
      <li>Carga de garaje: ${formatearPotencia(resultado.potenciaGaraje)} W</li>
      ${detalleRecarga}
      <li>Carga de recarga: ${formatearPotencia(resultado.potenciaRecarga)} W</li>
      <li>Total: ${formatearPotencia(resultado.potenciaTotal)} W</li>
    </ul>
    <p class="formula">Fórmula: ${resultado.formula}</p>
    <p class="ayuda">${resultado.referencia}</p>
    ${resultado.nEstacionesRecarga > 0 ? `<p class="ayuda">${resultado.referenciaRecarga}</p>` : ""}
  `;
}

function formatearPotencia(valor) {
  return Number(valor).toLocaleString("es-ES", { maximumFractionDigits: 2 });
}

function escapar(valor) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
