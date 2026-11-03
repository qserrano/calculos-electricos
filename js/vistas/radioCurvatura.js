import tubos from "../../data/tubos.json" with { type: "json" };
import { TIPOS_CURVATURA, calcularRadioCurvatura } from "../calculos/radioCurvatura.js";
import { formatearNumero } from "../utils/format.js";

export function renderRadioCurvatura(contenedor) {
  const opcionesTipo = TIPOS_CURVATURA.map(
    (tipo, indice) => `
      <label>
        <input type="radio" name="tipo" value="${tipo.id}" ${indice === 0 ? "checked" : ""} />
        ${tipo.etiqueta} (k = ${tipo.k})
      </label>
    `,
  ).join("");

  const opcionesSeccion = tubos.conductores
    .map((conductor) => `<option value="${conductor.seccion}">${formatearSeccion(conductor.seccion)}</option>`)
    .join("");

  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Radio de curvatura mínimo admisible</h2>
        <p>Calcula el radio mínimo de curvatura a partir de la sección del cable. El diámetro exterior se toma de la tabla y el radio es el producto de k por ese diámetro.</p>
      </header>

      <form class="form-calculo" id="form-radio-curvatura" novalidate>
        <fieldset class="campo">
          <legend>Tipo de cable</legend>
          <div class="opciones">
            ${opcionesTipo}
          </div>
        </fieldset>

        <label class="campo">
          <span>Sección del cable</span>
          <span class="campo-control">
            <select name="seccion" required>${opcionesSeccion}</select>
            <span class="unidad">mm²</span>
          </span>
        </label>

        <p class="ayuda">k vale 4 en conductores unipolares sin cubierta, 5 en cables multipolares con cubierta de sección menor de 16 mm² y 10 cuando esa sección es de 16 mm² o mayor. El diámetro exterior correspondiente a la sección sale de la tabla y el radio queda en mm.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-radio-curvatura" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-radio-curvatura");
  const resultado = contenedor.querySelector("#resultado-radio-curvatura");
  form.elements.seccion.value = "2.5";

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    mostrarResultado(
      resultado,
      calcularRadioCurvatura({
        tipo: form.elements.tipo.value,
        seccion: form.elements.seccion.value,
      }),
    );
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
      <span>Radio mínimo admisible</span>
      <strong>${formatearNumero(resultado.radio)} mm</strong>
    </p>
    <ul class="resultado-detalle">
      <li>Coeficiente k: ${resultado.k}</li>
      <li>Tipo de cable: ${resultado.etiquetaTipo}</li>
      <li>Sección: ${formatearSeccion(resultado.seccion)} mm²</li>
      <li>Diámetro exterior: ${formatearNumero(resultado.diametro)} mm</li>
    </ul>
    <p class="formula">Fórmula: ${resultado.formula}</p>
  `;
}

function formatearSeccion(valor) {
  return String(valor);
}
