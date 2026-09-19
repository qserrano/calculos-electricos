import cables from "../../data/cables.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esNumeroPositivo } from "../utils/validation.js";

const FORMULA = "R = L / (γ · s)";
const FORMULA_TEMPERATURA = "Rθ = R20 · [1 + α · (θ − 20)]";

export function calcularResistenciaConductor({ longitud, seccion, material, aislante }) {
  const errores = [];

  if (!esNumeroPositivo(longitud)) {
    errores.push("La longitud debe ser un número mayor que 0.");
  }

  if (!esNumeroPositivo(seccion)) {
    errores.push("La sección debe ser un número mayor que 0.");
  }

  if (material !== "cobre" && material !== "aluminio") {
    errores.push("Indica si el conductor es de cobre o de aluminio.");
  }

  if (!cables.aislantes[aislante]) {
    errores.push("Indica el tipo de aislante del cable (PVC o XLPE / EPR).");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const L = Number(longitud);
  const s = Number(seccion);
  const gamma20 = cables.conductividad[material];
  const alfa = cables.coeficienteTemperatura[material];
  const datosAislante = cables.aislantes[aislante];
  const temperatura = datosAislante.temperatura;
  const factorTemperatura = 1 + alfa * (temperatura - 20);
  const resistencia20 = L / (gamma20 * s);
  const resistenciaServicio = resistencia20 * factorTemperatura;
  const resistividad20 = 1 / gamma20;
  const resistividadServicio = resistividad20 * factorTemperatura;

  return {
    ok: true,
    material,
    aislante,
    etiquetaAislante: datosAislante.etiqueta,
    temperaturaServicio: temperatura,
    gamma20,
    alfa,
    formula: FORMULA,
    formulaTemperatura: FORMULA_TEMPERATURA,
    resistencia20: redondear(resistencia20, 4),
    resistenciaServicio: redondear(resistenciaServicio, 4),
    resistividad20: redondear(resistividad20, 5),
    resistividadServicio: redondear(resistividadServicio, 5),
  };
}
