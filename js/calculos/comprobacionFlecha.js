import { redondear } from "../utils/math.js";
import { esNumeroFinitoNoNegativo, esNumeroPositivo } from "../utils/validation.js";

const FORMULA_FACTOR = "Factor = fmedida / fteórica";
const FORMULA_DESVIACION = "Desviación % = (Factor − 1) · 100";

export function calcularComprobacionFlecha({ flechaMedida, flechaTeorica }) {
  const errores = [];

  if (!esNumeroFinitoNoNegativo(flechaMedida)) {
    errores.push("La flecha medida debe ser un número igual o mayor que 0.");
  }

  if (!esNumeroPositivo(flechaTeorica)) {
    errores.push("La flecha teórica debe ser un número mayor que 0.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const medida = Number(flechaMedida);
  const teorica = Number(flechaTeorica);
  const factor = medida / teorica;
  const desviacionPorcentaje = (factor - 1) * 100;

  return {
    ok: true,
    flechaMedida: redondear(medida, 3),
    flechaTeorica: redondear(teorica, 3),
    factor: redondear(factor, 4),
    desviacionPorcentaje: redondear(desviacionPorcentaje, 2),
    formulaFactor: FORMULA_FACTOR,
    formulaDesviacion: FORMULA_DESVIACION,
  };
}
