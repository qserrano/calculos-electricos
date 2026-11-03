import tubos from "../../data/tubos.json" with { type: "json" };
import { calcularDiametroTubo } from "../calculos/diametroTubo.js";
import { formatearNumero } from "../utils/format.js";

const INSTALACIONES = [
  ["superficie", "Superficie"],
  ["empotrada", "Empotrada"],
  ["aire", "Al aire"],
];

export function renderDiametroTubo(contenedor) {
  const opcionesInstalacion = INSTALACIONES.map(
    ([id, etiqueta], indice) => `
      <label>
        <input type="radio" name="instalacion" value="${id}" ${indice === 0 ? "checked" : ""} />
        ${etiqueta} (factor ${formatearFactor(tubos.instalaciones[id].factor)})
      </label>
    `,
  ).join("");

  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Diámetro del tubo</h2>
        <p>Calcula el diámetro comercial del tubo que aloja varios conductores de distinta sección.</p>
      </header>

      <form class="form-calculo" id="form-diametro-tubo" novalidate>
        <fieldset class="campo">
          <legend>Sistema de instalación</legend>
          <div class="opciones">
            ${opcionesInstalacion}
          </div>
        </fieldset>

        <fieldset class="campo">
          <legend>Conductores</legend>
          <div class="lista-conductores" id="lista-conductores"></div>
          <button type="button" class="secundario" id="anadir-conductor">Añadir sección</button>
        </fieldset>

        <p class="ayuda">Cada conductor ocupa el área de su diámetro exterior. El tubo debe tener esa suma multiplicada por el factor de llenado: 2,5 en superficie, 3 empotrada y 4 al aire. Superficie usa tubo rígido; empotrada y al aire, tubo corrugado. Se elige el menor diámetro comercial cuyo interior cubre el calculado.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-diametro-tubo" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-diametro-tubo");
  const resultado = contenedor.querySelector("#resultado-diametro-tubo");
  const lista = contenedor.querySelector("#lista-conductores");
  const conductores = [{ seccion: "2.5", cantidad: "" }];

  pintarConductores(lista, conductores);

  contenedor.querySelector("#anadir-conductor").addEventListener("click", () => {
    guardarConductores(lista, conductores);
    conductores.push({ seccion: conductores.at(-1)?.seccion ?? "2.5", cantidad: "" });
    pintarConductores(lista, conductores);
  });

  lista.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-quitar]");
    if (!boton || conductores.length === 1) {
      return;
    }
    guardarConductores(lista, conductores);
    conductores.splice(Number(boton.dataset.quitar), 1);
    pintarConductores(lista, conductores);
  });

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    guardarConductores(lista, conductores);
    mostrarResultado(
      resultado,
      calcularDiametroTubo({
        instalacion: form.elements.instalacion.value,
        conductores,
      }),
    );
  });
}

function pintarConductores(lista, conductores) {
  const opciones = tubos.conductores
    .map((conductor) => `<option value="${conductor.seccion}">${formatearSeccion(conductor.seccion)}</option>`)
    .join("");

  lista.innerHTML = conductores
    .map(
      (grupo, indice) => `
        <div class="conductor-item">
          <label class="campo">
            <span>Grupo ${indice + 1} — sección</span>
            <span class="campo-control">
              <select data-seccion required>${opciones}</select>
              <span class="unidad">mm²</span>
            </span>
          </label>
          <label class="campo">
            <span>Cantidad</span>
            <span class="campo-control">
              <input type="number" data-cantidad min="1" step="1" value="${escapar(grupo.cantidad)}" required />
            </span>
          </label>
          <button type="button" class="secundario" data-quitar="${indice}" ${conductores.length === 1 ? "disabled" : ""}>Quitar</button>
        </div>
      `,
    )
    .join("");

  lista.querySelectorAll("[data-seccion]").forEach((select, indice) => {
    if (tubos.conductores.some((conductor) => Math.abs(conductor.seccion - Number(conductores[indice].seccion)) < 1e-9)) {
      select.value = String(Number(conductores[indice].seccion));
    }
  });
}

function guardarConductores(lista, conductores) {
  lista.querySelectorAll(".conductor-item").forEach((fila, indice) => {
    conductores[indice] = {
      seccion: fila.querySelector("[data-seccion]").value,
      cantidad: fila.querySelector("[data-cantidad]").value,
    };
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

  const detalle = resultado.conductores
    .map(
      (grupo) =>
        `<li>${grupo.cantidad} × ${formatearSeccion(grupo.seccion)} mm², diámetro ${formatearNumero(grupo.diametro)} mm → ${formatearNumero(grupo.seccionOcupada)} mm²</li>`,
    )
    .join("");

  contenedor.className = "resultado";
  contenedor.innerHTML = `
    <h3>Resultado</h3>
    <p class="resultado-principal">
      <span>Diámetro comercial</span>
      <strong>${formatearSeccion(resultado.diametroComercial)} mm</strong>
    </p>
    <p class="formula">${resultado.etiquetaTubo}, instalación ${resultado.etiquetaInstalacion.toLowerCase()}.</p>
    <ul class="resultado-detalle">
      ${detalle}
      <li>Sección ocupada por los conductores: ${formatearNumero(resultado.seccionOcupada)} mm²</li>
      <li>Sección con factor de llenado ${formatearFactor(resultado.factor)}: ${formatearNumero(resultado.seccionTubo)} mm²</li>
      <li>Diámetro interior calculado: ${formatearNumero(resultado.diametroCalculado)} mm</li>
      <li>Diámetro interior del tubo elegido: ${formatearNumero(resultado.diametroInteriorTubo)} mm</li>
    </ul>
    <p class="formula">Fórmula: ${resultado.formula}</p>
  `;
}

function formatearSeccion(valor) {
  return String(valor);
}

function formatearFactor(valor) {
  return Number.isInteger(valor) ? String(valor) : formatearNumero(valor, 1);
}

function escapar(valor) {
  return String(valor).replace(/"/g, "&quot;");
}
