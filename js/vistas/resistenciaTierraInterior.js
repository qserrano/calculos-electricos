import datosTierra from "../../data/resistenciaTierra.json" with { type: "json" };
import { calcularResistenciaTierraInterior } from "../calculos/resistenciaTierraInterior.js";
import { formatearNumero } from "../utils/format.js";

export function renderResistenciaTierraInterior(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Resistencia de tierra</h2>
        <p>Calcula la resistencia de un anillo de cable desnudo, de picas verticales unidas por cable o de una placa enterrada.</p>
      </header>

      <form class="form-calculo" id="form-tierra-interior" novalidate>
        <fieldset class="campo">
          <legend>Tipo de tierra</legend>
          <div class="opciones">
            <label>
              <input type="radio" name="tipo" value="anillo" checked />
              Anillo de cable desnudo
            </label>
            <label>
              <input type="radio" name="tipo" value="picas" />
              Picas verticales
            </label>
            <label>
              <input type="radio" name="tipo" value="placa" />
              Placa enterrada
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

        <label class="campo" id="campo-longitud">
          <span id="etiqueta-longitud">Longitud del cable</span>
          <span class="campo-control">
            <input type="number" name="longitud" min="0" step="any" required />
            <span class="unidad">m</span>
          </span>
        </label>

        <label class="campo" id="campo-perimetro" hidden>
          <span>Perímetro de la placa (P)</span>
          <span class="campo-control">
            <input type="number" name="perimetro" min="0" step="any" />
            <span class="unidad">m</span>
          </span>
        </label>

        <label class="campo" id="campo-picas" hidden>
          <span>Número de picas</span>
          <input type="number" name="numeroPicas" min="1" step="1" />
        </label>

        <div class="ayuda">
          <p>Anillo de cable desnudo: R = (2 · ρ) / L. Picas verticales separadas una distancia doble de su longitud y unidas por cable: R = ρ / (n · L). Placa enterrada: R = (0,8 · ρ) / P, donde P es el perímetro. ρ es la resistividad del terreno.</p>
          <table class="tabla-ayuda">
            <caption>Resistividades medias</caption>
            <thead>
              <tr>
                <th>Terreno</th>
                <th>ρ (Ω·m)</th>
              </tr>
            </thead>
            <tbody>
              ${filasResistividad()}
            </tbody>
          </table>
        </div>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-tierra-interior" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-tierra-interior");
  const resultado = contenedor.querySelector("#resultado-tierra-interior");
  const campoLongitud = contenedor.querySelector("#campo-longitud");
  const campoPerimetro = contenedor.querySelector("#campo-perimetro");
  const campoPicas = contenedor.querySelector("#campo-picas");
  const etiquetaLongitud = contenedor.querySelector("#etiqueta-longitud");

  actualizarCampos(form, campoLongitud, campoPerimetro, campoPicas, etiquetaLongitud);

  form.querySelectorAll('input[name="tipo"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      actualizarCampos(form, campoLongitud, campoPerimetro, campoPicas, etiquetaLongitud);
    });
  });

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    mostrarResultado(
      resultado,
      calcularResistenciaTierraInterior({
        tipo: form.elements.tipo.value,
        resistividad: form.elements.resistividad.value,
        longitud: form.elements.longitud.value,
        perimetro: form.elements.perimetro.value,
        numeroPicas: form.elements.numeroPicas.value,
      }),
    );
  });
}

function filasResistividad() {
  return datosTierra.resistividadesMedias
    .map(
      (terreno) => `
        <tr>
          <td>${terreno.etiqueta}</td>
          <td>${formatearNumero(terreno.valor, 0)}</td>
        </tr>
      `,
    )
    .join("");
}

function actualizarCampos(form, campoLongitud, campoPerimetro, campoPicas, etiquetaLongitud) {
  const tipo = form.elements.tipo.value;
  const esPicas = tipo === "picas";
  const esPlaca = tipo === "placa";

  campoPicas.hidden = !esPicas;
  campoLongitud.hidden = esPlaca;
  campoPerimetro.hidden = !esPlaca;
  etiquetaLongitud.textContent = esPicas ? "Longitud de la pica" : "Longitud del cable";
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

  const detallePicas =
    resultado.tipo === "picas"
      ? `<li>Número de picas: ${resultado.numeroPicas}</li>
         <li>Separación entre picas: ${formatearNumero(resultado.longitud * 2)} m</li>`
      : "";

  contenedor.className = "resultado";
  contenedor.innerHTML = `
    <h3>Resultado</h3>
    <p class="resultado-principal">
      <span>Resistencia de tierra</span>
      <strong>${formatearNumero(resultado.resistencia)} Ω</strong>
    </p>
    <ul class="resultado-detalle">
      <li>Tipo: ${resultado.etiquetaTipo}</li>
      <li>Resistividad del terreno: ${formatearNumero(resultado.resistividad)} Ω·m</li>
      ${
        resultado.tipo === "placa"
          ? `<li>Perímetro: ${formatearNumero(resultado.perimetro)} m</li>`
          : `<li>Longitud: ${formatearNumero(resultado.longitud)} m</li>`
      }
      ${detallePicas}
    </ul>
    <p class="formula">Fórmula: ${resultado.formula}</p>
  `;
}
