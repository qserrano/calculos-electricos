import cables from "../../data/cables.json" with { type: "json" };
import constantesArchivo from "../../data/constantes.json" with { type: "json" };
import protecciones from "../../data/protecciones.json" with { type: "json" };
import { calcularProtecciones } from "../calculos/protecciones.js";
import { formatearNumero } from "../utils/format.js";

const constantes = {
  seccionMinimaAluminio: 16,
  ...constantesArchivo,
};

export function renderProtecciones(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Protecciones</h2>
        <p>Selecciona el magnetotérmico (y el diferencial, si lo necesitas) a partir de la intensidad de diseño y de la sección del cable.</p>
      </header>

      <form class="form-calculo" id="form-protecciones" novalidate>
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
          <legend>Tipo de carga</legend>
          <div class="opciones">
            <label>
              <input type="radio" name="carga" value="iluminacion" />
              Iluminación (curva B)
            </label>
            <label>
              <input type="radio" name="carga" value="general" checked />
              Usos generales (curva C)
            </label>
            <label>
              <input type="radio" name="carga" value="motores" />
              Motores (curva D)
            </label>
          </div>
        </fieldset>

        <label class="campo">
          <span>Intensidad de diseño (Ib)</span>
          <span class="campo-control">
            <input type="number" name="intensidad" min="0" step="any" required />
            <span class="unidad">A</span>
          </span>
        </label>

        <label class="campo">
          <span>Sección del conductor</span>
          <span class="campo-control">
            <select name="seccion" required></select>
            <span class="unidad">mm²</span>
          </span>
        </label>

        <label class="campo">
          <span>Corriente de cortocircuito prevista (Icc)</span>
          <span class="campo-control">
            <input type="number" name="corrienteCortocircuito" min="0" step="any" value="${protecciones.iccPorDefecto}" required />
            <span class="unidad">kA</span>
          </span>
        </label>

        <fieldset class="campo">
          <legend>Interruptor diferencial</legend>
          <div class="opciones">
            <label>
              <input type="radio" name="incluirDiferencial" value="si" checked />
              Incluir
            </label>
            <label>
              <input type="radio" name="incluirDiferencial" value="no" />
              No incluir
            </label>
          </div>
        </fieldset>

        <fieldset class="campo">
          <legend>Sensibilidad del diferencial</legend>
          <div class="opciones">
            <label>
              <input type="radio" name="proteccionDiferencial" value="personas" checked />
              Personas (30 mA)
            </label>
            <label>
              <input type="radio" name="proteccionDiferencial" value="incendio" />
              Incendio (300 mA)
            </label>
          </div>
        </fieldset>

        <p class="ayuda">El calibre cumple Ib ≤ In ≤ Iz (ITC-BT-19). La Icc de 6 kA es habitual en vivienda; ajústala si la conoces. El diferencial tipo A de 30 mA es el usual para protección de personas (ITC-BT-24).</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-protecciones" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-protecciones");
  const resultado = contenedor.querySelector("#resultado-protecciones");
  const campoSeccion = form.elements.seccion;

  rellenarSecciones(campoSeccion, "cobre", 2.5);

  form.querySelectorAll('input[name="material"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      rellenarSecciones(campoSeccion, radio.value, Number(campoSeccion.value));
    });
  });

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = {
      intensidad: form.elements.intensidad.value,
      tipo: form.elements.tipo.value,
      seccion: form.elements.seccion.value,
      material: form.elements.material.value,
      carga: form.elements.carga.value,
      corrienteCortocircuito: form.elements.corrienteCortocircuito.value,
      incluirDiferencial: form.elements.incluirDiferencial.value,
      proteccionDiferencial: form.elements.proteccionDiferencial.value,
    };

    mostrarResultado(resultado, calcularProtecciones(datos));
  });
}

function rellenarSecciones(select, material, preferida) {
  const minima = material === "aluminio" ? constantes.seccionMinimaAluminio : 0;
  const secciones = cables.secciones.filter((seccion) => seccion >= minima);
  select.innerHTML = secciones
    .map((seccion) => `<option value="${seccion}">${formatearSeccion(seccion)}</option>`)
    .join("");

  if (secciones.includes(preferida)) {
    select.value = String(preferida);
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

  const magnetotermico = `${resultado.curva}${resultado.In} ${resultado.polosMagnetotermico} ${formatearIcn(resultado.Icn)} kA`;
  const bloqueDiferencial = resultado.diferencial
    ? `
        <p class="resultado-principal">
          <span>Diferencial</span>
          <strong>${resultado.diferencial.sensibilidad} mA tipo ${resultado.diferencial.tipo} ${resultado.diferencial.polos} ${resultado.diferencial.In} A</strong>
        </p>
      `
    : "";

  contenedor.className = "resultado";
  contenedor.innerHTML = `
    <h3>Resultado</h3>
    <p class="resultado-principal">
      <span>Magnetotérmico</span>
      <strong>${magnetotermico}</strong>
    </p>
    ${bloqueDiferencial}
    <ul class="resultado-detalle">
      <li>Comprobación: ${formatearAmperios(resultado.Ib)} A ≤ ${resultado.In} A ≤ ${formatearAmperios(resultado.Iz)} A</li>
      <li>Convencional de fusión: I2 = ${formatearNumero(resultado.I2)} A ≤ 1,45·Iz = ${formatearNumero(resultado.limiteI2)} A</li>
      <li>Poder de corte: ${formatearIcn(resultado.Icn)} kA ≥ Icc ${formatearIcn(resultado.Icc)} kA</li>
      <li>Curva ${resultado.curva}: ${resultado.etiquetaCarga}</li>
    </ul>
    <p class="formula">Criterio: ${resultado.formula}</p>
    <p class="ayuda">${resultado.referencia}</p>
  `;
}

function formatearSeccion(valor) {
  return Number.isInteger(valor) ? String(valor) : String(valor);
}

function formatearAmperios(valor) {
  return Number.isInteger(valor) ? String(valor) : String(valor);
}

function formatearIcn(valor) {
  return Number.isInteger(valor) ? String(valor) : String(valor);
}
