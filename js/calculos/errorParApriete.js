import { redondear } from "../utils/math.js";
import { esNumeroFinitoNoNegativo, esNumeroPositivo } from "../utils/validation.js";

const FORMULA = "Error % = ((Mmedido − Mnominal) / Mnominal) · 100";

export function calcularErrorParApriete({ momentoMedido, momentoNominal }) {
  const errores = [];

  if (!esNumeroFinitoNoNegativo(momentoMedido)) {
    errores.push("El momento medido debe ser un número igual o mayor que 0.");
  }

  if (!esNumeroPositivo(momentoNominal)) {
    errores.push("El momento nominal debe ser un número mayor que 0.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const medido = Number(momentoMedido);
  const nominal = Number(momentoNominal);
  const diferencia = medido - nominal;
  const errorPorcentaje = (diferencia / nominal) * 100;

  return {
    ok: true,
    momentoMedido: redondear(medido, 2),
    momentoNominal: redondear(nominal, 2),
    diferencia: redondear(diferencia, 2),
    errorPorcentaje: redondear(errorPorcentaje, 2),
    formula: FORMULA,
  };
}
