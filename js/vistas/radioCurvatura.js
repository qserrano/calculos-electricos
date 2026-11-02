import { TIPOS_CURVATURA, calcularRadioCurvatura } from "../calculos/radioCurvatura.js";
import { formatearNumero } from "../utils/format.js";

export function renderRadioCurvatura(contenedor) {
  const opciones = TIPOS_CURVATURA.map(
    (tipo, indice) => `
      <label>
        <input type="radio" name="tipo" value="${tipo.id}" ${indice === 0 ? "checked" : ""} />
        ${tipo.etiqueta} (k = ${tipo.k})
      </label>
    `,
  ).join("");

  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Radio de curvatura mínimo admisible</h2>
        <p>Calcula el radio mínimo de curvatura como el producto del coeficiente k por el diámetro exterior del cable.</p>
      </header>

      <form class="form-calculo" id="form-radio-curvatura" novalidate>
        <fieldset class="campo">
          <legend>Tipo de cable</legend>
          <div class="opciones">
            ${opciones}
          </div>
        </fieldset>

        <label class="campo">
          <span>Diámetro exterior</span>
          <span class="campo-control">
            <input type="number" name="diametro" min="0" step="any" required />
            <span class="unidad">mm</span>
          </span>
        </label>

        <p class="ayuda">k vale 4 en conductores unipolares sin cubierta, 5 en cables multipolares con cubierta de sección menor de 16 mm² y 10 cuando esa sección es de 16 mm² o mayor. El radio sale en mm.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-radio-curvatura" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-radio-curvatura");
  const resultado = contenedor.querySelector("#resultado-radio-curvatura");

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    mostrarResultado(
      resultado,
      calcularRadioCurvatura({
        tipo: form.elements.tipo.value,
        diametro: form.elements.diametro.value,
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
      <li>Diámetro exterior: ${formatearNumero(resultado.diametro)} mm</li>
    </ul>
    <p class="formula">Fórmula: ${resultado.formula}</p>
  `;
}
