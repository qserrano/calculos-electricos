import datos from "../../data/resistenciaTierra.json" with { type: "json" };
import { calcularResistenciaTierra } from "../calculos/resistenciaTierra.js";
import { formatearNumero } from "../utils/format.js";

export function renderResistenciaTierra(contenedor) {
  const valoresMedios = datos.resistividadesMedias
    .map((terreno) => `${terreno.etiqueta}: ${formatearNumero(terreno.valor, 0)} Ω·m`)
    .join("; ");

  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Resistencia de tierra</h2>
        <p>Estima la resistencia de una pica vertical (una o varias en paralelo) o de un conductor enterrado a partir de la resistividad del terreno y de la longitud del electrodo.</p>
      </header>

      <form class="form-calculo" id="form-tierra" novalidate>
        <fieldset class="campo">
          <legend>Tipo de electrodo</legend>
          <div class="opciones">
            <label>
              <input type="radio" name="electrodo" value="pica" checked />
              Pica vertical
            </label>
            <label>
              <input type="radio" name="electrodo" value="conductor" />
              Conductor enterrado
            </label>
          </div>
        </fieldset>

        <label class="campo" id="campo-picas">
          <span>Número de picas</span>
          <input type="number" name="numeroPicas" min="1" step="1" value="1" />
        </label>

        <label class="campo">
          <span>Resistividad del terreno (ρ)</span>
          <span class="campo-control">
            <input type="number" name="resistividad" min="0" step="any" required />
            <span class="unidad">Ω·m</span>
          </span>
        </label>

        <label class="campo">
          <span>Longitud</span>
          <span class="campo-control">
            <input type="number" name="longitud" min="0" step="any" required />
            <span class="unidad">m</span>
          </span>
        </label>

        <p class="ayuda">Fórmulas aproximadas de la ITC-BT-18, tabla 5. Varias picas iguales en paralelo: R = R₁ / n, con una separación mínima igual al doble de su longitud. El valor real se comprueba con telurómetro. Valores medios de ρ: ${valoresMedios}.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-tierra" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-tierra");
  const resultado = contenedor.querySelector("#resultado-tierra");
  const campoPicas = contenedor.querySelector("#campo-picas");

  actualizarCampoPicas(form, campoPicas);

  form.querySelectorAll('input[name="electrodo"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      actualizarCampoPicas(form, campoPicas);
    });
  });

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datosFormulario = {
      electrodo: form.elements.electrodo.value,
      resistividad: form.elements.resistividad.value,
      longitud: form.elements.longitud.value,
      numeroPicas: form.elements.numeroPicas.value,
    };

    mostrarResultado(resultado, calcularResistenciaTierra(datosFormulario));
  });
}

function actualizarCampoPicas(form, campoPicas) {
  const esPica = form.elements.electrodo.value === "pica";
  campoPicas.hidden = !esPica;
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

  const detallePicas = resultado.enParalelo
    ? `
      <li>Picas en paralelo: ${resultado.numeroPicas}</li>
      <li>Una pica: ${formatearNumero(resultado.resistenciaUna)} Ω</li>
      <li>Separación mínima (2L): ${formatearNumero(resultado.separacionMinima)} m</li>
    `
    : resultado.electrodo === "pica"
      ? `<li>Picas: 1</li>`
      : "";

  contenedor.className = "resultado";
  contenedor.innerHTML = `
    <h3>Resultado</h3>
    <p class="resultado-principal">
      <span>Resistencia de tierra</span>
      <strong>${formatearNumero(resultado.resistencia)} Ω</strong>
    </p>
    <ul class="resultado-detalle">
      <li>Electrodo: ${resultado.etiquetaElectrodo}</li>
      <li>ρ = ${formatearNumero(resultado.resistividad)} Ω·m</li>
      <li>L = ${formatearNumero(resultado.longitud)} m</li>
      ${detallePicas}
    </ul>
    <p class="formula">Fórmula: ${resultado.formula}</p>
    <p class="ayuda">${resultado.referencia}</p>
  `;
}
