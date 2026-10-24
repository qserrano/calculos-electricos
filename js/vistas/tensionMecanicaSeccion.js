import cables from "../../data/cables.json" with { type: "json" };
import { calcularTensionMecanicaSeccion } from "../calculos/tensionMecanicaSeccion.js";
import { formatearNumero } from "../utils/format.js";

export function renderTensionMecanicaSeccion(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Tensión mecánica por unidad de sección</h2>
        <p>Divide la tensión mecánica del conductor entre su sección.</p>
      </header>

      <form class="form-calculo" id="form-tension-mecanica" novalidate>
        <label class="campo">
          <span>Tensión mecánica</span>
          <span class="campo-control">
            <input type="number" name="tension" min="0" step="any" required />
            <span class="unidad">daN</span>
          </span>
        </label>

        <label class="campo">
          <span>Sección</span>
          <span class="campo-control">
            <select name="seccion" required></select>
            <span class="unidad">mm²</span>
          </span>
        </label>

        <p class="ayuda">Solo se admiten las secciones del neutro fiador de los cables trenzados RZ: 29,5, 55,6 y 80 mm². El resultado es la tensión mecánica unitaria, para compararla con la admisible del material.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-tension-mecanica" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-tension-mecanica");
  const resultado = contenedor.querySelector("#resultado-tension-mecanica");
  const campoSeccion = form.elements.seccion;

  campoSeccion.innerHTML = cables.seccionesNeutroRZ
    .map((seccion) => `<option value="${seccion}">${formatearSeccion(seccion)}</option>`)
    .join("");

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = {
      tension: form.elements.tension.value,
      seccion: form.elements.seccion.value,
    };

    mostrarResultado(resultado, calcularTensionMecanicaSeccion(datos));
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

  contenedor.className = "resultado";
  contenedor.innerHTML = `
    <h3>Resultado</h3>
    <p class="resultado-principal">
      <span>Tensión mecánica unitaria</span>
      <strong>${formatearNumero(resultado.tensionUnitaria, 4)} daN/mm²</strong>
    </p>
    <ul class="resultado-detalle">
      <li>Tensión mecánica: ${formatearNumero(resultado.tension)} daN</li>
      <li>Sección: ${formatearSeccion(resultado.seccion)} mm²</li>
    </ul>
    <p class="formula">Fórmula: ${resultado.formula}</p>
  `;
}

function formatearSeccion(valor) {
  return String(valor);
}
