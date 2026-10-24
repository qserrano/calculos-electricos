import cables from "../../data/cables.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esNumeroFinito, esNumeroPositivo } from "../utils/validation.js";

const FORMULA = "R₂ = R₁ · [1 + α · (θ₂ − 20)] / [1 + α · (θ₁ − 20)]";
const FORMULA_DESDE_20 = "Rθ = R20 · [1 + α · (θ − 20)]";

export function calcularVariacionResistenciaTemperatura({
  resistencia,
  temperaturaInicial,
  temperaturaFinal,
  material,
}) {
  const errores = [];

  if (!esNumeroPositivo(resistencia)) {
    errores.push("La resistencia debe ser un número mayor que 0.");
  }

  if (!esNumeroFinito(temperaturaInicial)) {
    errores.push("La temperatura inicial debe ser un número.");
  }

  if (!esNumeroFinito(temperaturaFinal)) {
    errores.push("La temperatura final debe ser un número.");
  }

  if (material !== "cobre" && material !== "aluminio") {
    errores.push("Indica si el conductor es de cobre o de aluminio.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const r1 = Number(resistencia);
  const t1 = Number(temperaturaInicial);
  const t2 = Number(temperaturaFinal);
  const alfa = cables.coeficienteTemperatura[material];
  const factor1 = 1 + alfa * (t1 - 20);
  const factor2 = 1 + alfa * (t2 - 20);

  if (factor1 <= 0 || factor2 <= 0) {
    return {
      ok: false,
      errores: [
        "Alguna temperatura queda por debajo del cero del modelo lineal y la resistencia no sería positiva.",
      ],
    };
  }

  const resistencia20 = r1 / factor1;
  const resistenciaFinal = resistencia20 * factor2;
  const variacion = resistenciaFinal - r1;

  return {
    ok: true,
    material,
    alfa,
    temperaturaInicial: t1,
    temperaturaFinal: t2,
    formula: t1 === 20 ? FORMULA_DESDE_20 : FORMULA,
    resistenciaInicial: redondear(r1, 4),
    resistencia20: redondear(resistencia20, 4),
    resistenciaFinal: redondear(resistenciaFinal, 4),
    variacion: redondear(variacion, 4),
    variacionPorcentaje: redondear((variacion / r1) * 100, 2),
    factor: redondear(factor2 / factor1, 4),
  };
}
