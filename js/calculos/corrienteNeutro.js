import { FORMULA_NEUTRO, corrienteNeutroDeFases } from "./intensidadNeutro.js";
import { redondear } from "../utils/math.js";
import { esNumeroFinitoNoNegativo } from "../utils/validation.js";

export function calcularCorrienteNeutro({ intensidadL1, intensidadL2, intensidadL3 }) {
  const errores = [];

  if (!esNumeroFinitoNoNegativo(intensidadL1)) {
    errores.push("La intensidad de L1 debe ser un número mayor o igual que 0.");
  }

  if (!esNumeroFinitoNoNegativo(intensidadL2)) {
    errores.push("La intensidad de L2 debe ser un número mayor o igual que 0.");
  }

  if (!esNumeroFinitoNoNegativo(intensidadL3)) {
    errores.push("La intensidad de L3 debe ser un número mayor o igual que 0.");
  }

  const I1 = Number(intensidadL1);
  const I2 = Number(intensidadL2);
  const I3 = Number(intensidadL3);

  if (errores.length === 0 && I1 === 0 && I2 === 0 && I3 === 0) {
    errores.push("Indica al menos una intensidad de fase mayor que 0.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  return {
    ok: true,
    intensidadL1: redondear(I1, 2),
    intensidadL2: redondear(I2, 2),
    intensidadL3: redondear(I3, 2),
    corrienteNeutro: redondear(corrienteNeutroDeFases(I1, I2, I3), 2),
    formula: FORMULA_NEUTRO,
  };
}
