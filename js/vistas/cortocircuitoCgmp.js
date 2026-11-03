import cables from "../../data/cables.json" with { type: "json" };
import constantes from "../../data/constantes.json" with { type: "json" };
import { calcularCortocircuitoCgmp } from "../calculos/cortocircuitoCgmp.js";
import { formatearNumero } from "../utils/format.js";

export function renderCortocircuitoCgmp(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Intensidad de cortocircuito en CGMP</h2>
        <p>Calcula la intensidad de cortocircuito máxima en el cuadro general de mando y protección a partir de la línea general de alimentación y la derivación individual.</p>
      </header>

      <form class="form-calculo" id="form-cortocircuito" novalidate>
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
          <legend>Línea general de alimentación (LGA)</legend>
          <div class="opciones">
            <label>
              <input type="radio" name="materialLga" value="cobre" checked />
              Cobre
            </label>
            <label>
              <input type="radio" name="materialLga" value="aluminio" />
              Aluminio
            </label>
          </div>
          <label class="campo">
            <span>Longitud</span>
            <span class="campo-control">
              <input type="number" name="longitudLga" min="0" step="any" required />
              <span class="unidad">m</span>
            </span>
          </label>
          <label class="campo">
            <span>Sección</span>
            <span class="campo-control">
              <select name="seccionLga" required></select>
              <span class="unidad">mm²</span>
            </span>
          </label>
        </fieldset>

        <fieldset class="campo">
          <legend>Derivación individual (DI)</legend>
          <div class="opciones">
            <label>
              <input type="radio" name="materialDi" value="cobre" checked />
              Cobre
            </label>
            <label>
              <input type="radio" name="materialDi" value="aluminio" />
              Aluminio
            </label>
          </div>
          <label class="campo">
            <span>Longitud</span>
            <span class="campo-control">
              <input type="number" name="longitudDi" min="0" step="any" required />
              <span class="unidad">m</span>
            </span>
          </label>
          <label class="campo">
            <span>Sección</span>
            <span class="campo-control">
              <select name="seccionDi" required></select>
              <span class="unidad">mm²</span>
            </span>
          </label>
        </fieldset>

        <p class="ayuda">Método simplificado de la Guía-BT, anexo 3. Los conductores se toman a 20 °C y se desprecia la inductancia. La tensión en el origen del cortocircuito es 0,8 veces la de suministro: ${constantes.tensionMonofasica} V en monofásica y ${constantes.tensionTrifasica} V en trifásica. En monofásica la resistencia incluye la ida y el retorno, R = 2 · L / (γ · s), e Icc = 0,8 · U / R. En trifásica R es la de un conductor de fase, R = L / (γ · s), e Icc = 0,8 · U / (√3 · R). γ a 20 °C es ${cables.conductividad.cobre} m/(Ω·mm²) en cobre y ${cables.conductividad.aluminio} en aluminio. El método vale cuando el centro de transformación está fuera del edificio. En aluminio la sección mínima es ${constantes.seccionMinimaAluminio} mm².</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-cortocircuito" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-cortocircuito");
  const resultado = contenedor.querySelector("#resultado-cortocircuito");

  rellenarSecciones(form.elements.seccionLga, "cobre", 95);
  rellenarSecciones(form.elements.seccionDi, "cobre", 10);

  form.querySelectorAll('input[name="materialLga"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      rellenarSecciones(form.elements.seccionLga, radio.value, Number(form.elements.seccionLga.value));
    });
  });

  form.querySelectorAll('input[name="materialDi"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      rellenarSecciones(form.elements.seccionDi, radio.value, Number(form.elements.seccionDi.value));
    });
  });

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    mostrarResultado(
      resultado,
      calcularCortocircuitoCgmp({
        tipo: form.elements.tipo.value,
        materialLga: form.elements.materialLga.value,
        longitudLga: form.elements.longitudLga.value,
        seccionLga: form.elements.seccionLga.value,
        materialDi: form.elements.materialDi.value,
        longitudDi: form.elements.longitudDi.value,
        seccionDi: form.elements.seccionDi.value,
      }),
    );
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

  contenedor.className = "resultado";
  contenedor.innerHTML = `
    <h3>Resultado</h3>
    <p class="resultado-principal">
      <span>Intensidad de cortocircuito</span>
      <strong>${formatearNumero(resultado.intensidad)} A</strong>
    </p>
    <ul class="resultado-detalle">
      <li>Suministro: ${resultado.etiquetaTipo}</li>
      <li>Tensión: ${formatearNumero(resultado.tension, 0)} V</li>
      <li>LGA: ${etiquetaMaterial(resultado.materialLga)}, ${formatearNumero(resultado.longitudLga)} m, ${formatearSeccion(resultado.seccionLga)} mm², γ = ${resultado.gammaLga}, R = ${formatearNumero(resultado.resistenciaLga, 4)} Ω</li>
      <li>DI: ${etiquetaMaterial(resultado.materialDi)}, ${formatearNumero(resultado.longitudDi)} m, ${formatearSeccion(resultado.seccionDi)} mm², γ = ${resultado.gammaDi}, R = ${formatearNumero(resultado.resistenciaDi, 4)} Ω</li>
      <li>Resistencia total: ${formatearNumero(resultado.resistencia, 4)} Ω</li>
    </ul>
    <p class="formula">Fórmulas: ${resultado.formulaResistencia} ; ${resultado.formula}</p>
  `;
}

function etiquetaMaterial(material) {
  return material === "aluminio" ? "aluminio" : "cobre";
}

function formatearSeccion(valor) {
  return Number.isInteger(valor) ? String(valor) : String(valor);
}
