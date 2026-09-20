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
        <p>Estima la resistencia de una pica vertical o de un conductor enterrado a partir de la resistividad del terreno y de la longitud del electrodo.</p>
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

        <p class="ayuda">Fórmulas aproximadas de la ITC-BT-18, tabla 5. El valor real se comprueba con telurómetro. Valores medios de ρ: ${valoresMedios}.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-tierra" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-tierra");
  const resultado = contenedor.querySelector("#resultado-tierra");

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datosFormulario = {
      electrodo: form.elements.electrodo.value,
      resistividad: form.elements.resistividad.value,
      longitud: form.elements.longitud.value,
    };

    mostrarResultado(resultado, calcularResistenciaTierra(datosFormulario));
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
      <span>Resistencia de tierra</span>
      <strong>${formatearNumero(resultado.resistencia)} Ω</strong>
    </p>
    <ul class="resultado-detalle">
      <li>Electrodo: ${resultado.etiquetaElectrodo}</li>
      <li>ρ = ${formatearNumero(resultado.resistividad)} Ω·m</li>
      <li>L = ${formatearNumero(resultado.longitud)} m</li>
    </ul>
    <p class="formula">Fórmula: ${resultado.formula}</p>
    <p class="ayuda">${resultado.referencia}</p>
  `;
}
