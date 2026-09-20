import cables from "../../data/cables.json" with { type: "json" };
import constantesArchivo from "../../data/constantes.json" with { type: "json" };
import { calcularIntensidadNeutro } from "../calculos/intensidadNeutro.js";
import { formatearNumero } from "../utils/format.js";

const constantes = {
  seccionMinimaAluminio: 16,
  ...constantesArchivo,
};

export function renderIntensidadNeutro(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Intensidad de neutro</h2>
        <p>Calcula la intensidad del conductor de neutro en un suministro trifásico 230/400 V y la caída de tensión de la fase más cargada a partir de las resistencias de fase y de neutro.</p>
      </header>

      <form class="form-calculo" id="form-neutro" novalidate>
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

        <label class="campo">
          <span>Intensidad L1</span>
          <span class="campo-control">
            <input type="number" name="intensidadL1" min="0" step="any" required />
            <span class="unidad">A</span>
          </span>
        </label>

        <label class="campo">
          <span>Intensidad L2</span>
          <span class="campo-control">
            <input type="number" name="intensidadL2" min="0" step="any" required />
            <span class="unidad">A</span>
          </span>
        </label>

        <label class="campo">
          <span>Intensidad L3</span>
          <span class="campo-control">
            <input type="number" name="intensidadL3" min="0" step="any" required />
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
          <span>Sección de fase</span>
          <span class="campo-control">
            <select name="seccionFase" required></select>
            <span class="unidad">mm²</span>
          </span>
        </label>

        <label class="campo">
          <span>Sección de neutro</span>
          <span class="campo-control">
            <select name="seccionNeutro" required></select>
            <span class="unidad">mm²</span>
          </span>
        </label>

        <p class="ayuda">El suministro es trifásico 230/400 V. La intensidad de neutro supone las tres corrientes desfasadas 120° con el mismo factor de potencia. Rf y Rn son las resistencias de un solo conductor (ida). La caída en la fase más cargada es ΔV = IL · Rf + IN · Rn, referida a 230 V. El neutro puede tener una sección distinta de las fases.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-neutro" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-neutro");
  const resultado = contenedor.querySelector("#resultado-neutro");
  const campoSeccionFase = form.elements.seccionFase;
  const campoSeccionNeutro = form.elements.seccionNeutro;

  rellenarSecciones(campoSeccionFase, "cobre", 2.5);
  rellenarSecciones(campoSeccionNeutro, "cobre", 2.5);

  form.querySelectorAll('input[name="material"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      rellenarSecciones(campoSeccionFase, radio.value, Number(campoSeccionFase.value));
      rellenarSecciones(campoSeccionNeutro, radio.value, Number(campoSeccionNeutro.value));
    });
  });

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = {
      intensidadL1: form.elements.intensidadL1.value,
      intensidadL2: form.elements.intensidadL2.value,
      intensidadL3: form.elements.intensidadL3.value,
      longitud: form.elements.longitud.value,
      seccionFase: form.elements.seccionFase.value,
      seccionNeutro: form.elements.seccionNeutro.value,
      material: form.elements.material.value,
      aislante: form.elements.aislante.value,
    };

    mostrarResultado(resultado, calcularIntensidadNeutro(datos));
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

  const etiquetaFases = formatearFases(resultado.fasesMaximas);

  contenedor.className = "resultado";
  contenedor.innerHTML = `
    <h3>Resultado</h3>
    <p class="resultado-principal">
      <span>Intensidad de neutro</span>
      <strong>${formatearNumero(resultado.intensidadNeutro)} A</strong>
    </p>
    <p class="resultado-principal">
      <span>Caída en la fase más cargada</span>
      <strong>${formatearNumero(resultado.caidaPorcentaje)} %</strong>
    </p>
    <ul class="resultado-detalle">
      <li>L1 = ${formatearNumero(resultado.intensidadL1)} A, L2 = ${formatearNumero(resultado.intensidadL2)} A, L3 = ${formatearNumero(resultado.intensidadL3)} A</li>
      <li>Fase más cargada: ${etiquetaFases} (${formatearNumero(resultado.intensidadMaxima)} A)</li>
      <li>sf = ${formatearNumero(resultado.seccionFase)} mm², sn = ${formatearNumero(resultado.seccionNeutro)} mm²</li>
      <li>Rf = ${formatearNumero(resultado.resistenciaFase, 4)} Ω, Rn = ${formatearNumero(resultado.resistenciaNeutro, 4)} Ω</li>
      <li>IL · Rf = ${formatearNumero(resultado.caidaFase)} V, IN · Rn = ${formatearNumero(resultado.caidaNeutro)} V</li>
      <li>Caída absoluta: ${formatearNumero(resultado.caidaVoltios)} V sobre ${resultado.tensionFase} V</li>
      <li>Aislante: ${resultado.etiquetaAislante}</li>
      <li>Conductividad a ${resultado.temperaturaServicio} °C: γ = ${formatearNumero(resultado.gamma)} m/(Ω·mm²)</li>
    </ul>
    <p class="formula">Fórmula del neutro: ${resultado.formulaNeutro}</p>
    <p class="formula">Fórmulas de la caída: ${resultado.formulaResistencia}</p>
    <p class="formula">${resultado.formulaCaida}</p>
  `;
}

function formatearFases(fases) {
  if (fases.length === 1) {
    return fases[0];
  }
  if (fases.length === 2) {
    return `${fases[0]} y ${fases[1]}`;
  }
  return "L1, L2 y L3";
}

function formatearSeccion(valor) {
  return Number.isInteger(valor) ? String(valor) : String(valor);
}
