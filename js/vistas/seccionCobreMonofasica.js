import constantesArchivo from "../../data/constantes.json" with { type: "json" };
import { calcularSeccionCobreMonofasica } from "../calculos/seccionCobreMonofasica.js";
import { formatearNumero } from "../utils/format.js";

const constantes = {
  tensionMonofasica: 230,
  caidaTensionIluminacion: 3,
  caidaTensionOtros: 5,
  ...constantesArchivo,
};

export function renderSeccionCobreMonofasica(contenedor) {
  contenedor.innerHTML = `
    <section class="calculo">
      <header class="calculo-cabecera">
        <h2>Sección de conductor de cobre</h2>
        <p>Calcula la sección de un circuito monofásico de cobre a partir de la potencia, la longitud, el aislante y el uso del circuito.</p>
      </header>

      <form class="form-calculo" id="form-seccion-cobre" novalidate>
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

        <fieldset class="campo">
          <legend>Uso del circuito</legend>
          <div class="opciones">
            <label>
              <input type="radio" name="uso" value="iluminacion" />
              Alumbrado (${constantes.caidaTensionIluminacion} %)
            </label>
            <label>
              <input type="radio" name="uso" value="otros" checked />
              Otros usos (${constantes.caidaTensionOtros} %)
            </label>
          </div>
        </fieldset>

        <label class="campo">
          <span>Potencia del circuito</span>
          <span class="campo-control">
            <input type="number" name="potencia" min="0" step="any" required />
            <span class="unidad">W</span>
          </span>
        </label>

        <label class="campo">
          <span>Longitud</span>
          <span class="campo-control">
            <input type="number" name="longitud" min="0" step="any" required />
            <span class="unidad">m</span>
          </span>
        </label>

        <p class="ayuda">Instalación monofásica de cobre a ${constantes.tensionMonofasica} V. El aislante fija la temperatura de servicio, 70 °C en PVC y 90 °C en XLPE, y con ella la conductividad γ. La caída permitida es el ${constantes.caidaTensionIluminacion} % en alumbrado y el ${constantes.caidaTensionOtros} % en otros usos (ITC-BT-19). La sección propuesta es la menor de la serie comercial que cubre la calculada. La misma ITC exige además 1,5 mm² en alumbrado y 2,5 mm² en otros usos.</p>

        <button type="submit">Calcular</button>
      </form>

      <div id="resultado-seccion-cobre" hidden></div>
    </section>
  `;

  const form = contenedor.querySelector("#form-seccion-cobre");
  const resultado = contenedor.querySelector("#resultado-seccion-cobre");

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    mostrarResultado(
      resultado,
      calcularSeccionCobreMonofasica({
        potencia: form.elements.potencia.value,
        longitud: form.elements.longitud.value,
        aislante: form.elements.aislante.value,
        uso: form.elements.uso.value,
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
      <span>Sección</span>
      <strong>${formatearSeccion(resultado.seccion)} mm²</strong>
    </p>
    <ul class="resultado-detalle">
      <li>Sección calculada: ${formatearNumero(resultado.seccionCalculada)} mm²</li>
      <li>Caída con esa sección: ${formatearNumero(resultado.caidaRealPorcentaje)} % (${formatearNumero(resultado.caidaRealVoltios)} V)</li>
      <li>Caída permitida (${resultado.etiquetaUso.toLowerCase()}): ${formatearNumero(resultado.caidaMaxima, 0)} % (${formatearNumero(resultado.caidaMaximaVoltios)} V)</li>
      <li>Aislante: ${resultado.etiquetaAislante}</li>
      <li>Conductividad a ${resultado.temperaturaServicio} °C: γ = ${formatearNumero(resultado.gamma)} m/(Ω·mm²)</li>
      <li>Potencia: ${formatearNumero(resultado.potencia)} W</li>
      <li>Longitud: ${formatearNumero(resultado.longitud)} m</li>
      <li>Tensión: ${formatearNumero(resultado.tension, 0)} V</li>
    </ul>
    <p class="formula">Fórmula: ${resultado.formula}</p>
  `;
}

function formatearSeccion(valor) {
  return Number.isInteger(valor) ? String(valor) : String(valor);
}
