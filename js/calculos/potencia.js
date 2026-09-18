import { redondear } from "../utils/math.js";
import { esFactorPotencia, esNumeroPositivo } from "../utils/validation.js";

const FORMULAS = {
  monofasica: "P = I · U · cos φ",
  trifasica: "P = √3 · I · U · cos φ",
};

export function calcularPotencia({ intensidad, tipo, tension, factorPotencia }) {
  const errores = [];

  if (!esNumeroPositivo(intensidad)) {
    errores.push("La intensidad debe ser un número mayor que 0.");
  }

  if (tipo !== "monofasica" && tipo !== "trifasica") {
    errores.push("Indica si el suministro es monofásico o trifásico.");
  }

  if (!esNumeroPositivo(tension)) {
    errores.push("La tensión debe ser un número mayor que 0.");
  }

  if (!esFactorPotencia(factorPotencia)) {
    errores.push("El factor de potencia (cos φ) debe estar entre 0 (no incluido) y 1.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const I = Number(intensidad);
  const U = Number(tension);
  const cosPhi = Number(factorPotencia);
  const factorFases = tipo === "trifasica" ? Math.sqrt(3) : 1;
  const potencia = factorFases * I * U * cosPhi;

  return {
    ok: true,
    potencia: redondear(potencia, 2),
    formula: FORMULAS[tipo],
    tipo,
  };
}
