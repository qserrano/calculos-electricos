import {
  TIPOS_PROTECCION,
  calcularSeccionConductorProteccion,
} from "../calculos/seccionConductorProteccion.js";
import { formatearNumero } from "../utils/format.js";

export function renderSeccionConductorProteccion(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Sección conductor protección</h2>
        <p>Calcula la sección mínima del conductor de protección a partir de la corriente de cortocircuito y del tiempo de disparo.</p>
      </header>

      <form class="form-calculo" id="form-proteccion" novalidate>
        <fieldset class="campo">
          <legend>Tipo de conductor</legend>
          <div class="opciones">
            ${TIPOS_PROTECCION.map(
              (opcion, indice) => `
                <label>
                  <input type="radio" name="tipo" value="${opcion.id}" ${indice === 0 ? "checked" : ""} />
                  ${opcion.etiqueta} (k = ${opcion.k})
                </label>
              `,
            ).join("")}
          </div>
        </fieldset>

        <label class="campo">
          <span>Corriente de cortocircuito (Icc)</span>
          <span class="campo-control">
            <input type="number" name="corrienteCortocircuito" min="0" step="any" required />
            <span class="unidad">A</span>
          </span>
        </label>

        <label class="campo">
          <span>Tiempo de disparo (t)</span>
          <span class="campo-control">
            <input type="number" name="tiempo" min="0" step="any" required />
            <span class="unidad">s</span>
          </span>
        </label>

        <p class="ayuda">Smin = √(Icc² · t) / k. k vale 115 con aislamiento PVC, 143 con aislamiento XLPE y 159 en cable desnudo de cobre. t es el tiempo de disparo de la protección, en segundos.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-proteccion" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-proteccion");
  const resultado = contenedor.querySelector("#resultado-proteccion");

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    mostrarResultado(
      resultado,
      calcularSeccionConductorProteccion({
        tipo: form.elements.tipo.value,
        corrienteCortocircuito: form.elements.corrienteCortocircuito.value,
        tiempo: form.elements.tiempo.value,
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
      <span>Sección mínima</span>
      <strong>${formatearNumero(resultado.seccion)} mm²</strong>
    </p>
    <ul class="resultado-detalle">
      <li>Tipo: ${resultado.etiquetaTipo}</li>
      <li>k = ${resultado.k}</li>
      <li>Icc = ${formatearNumero(resultado.corrienteCortocircuito)} A</li>
      <li>t = ${formatearNumero(resultado.tiempo)} s</li>
    </ul>
    <p class="formula">Fórmula: ${resultado.formula}</p>
  `;
}
