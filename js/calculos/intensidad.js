import { redondear } from "../utils/math.js";
import { esFactorPotencia, esNumeroPositivo } from "../utils/validation.js";

const FORMULAS = {
  monofasica: "I = P / (U · cos φ)",
  trifasica: "I = P / (√3 · U · cos φ)",
};

export function calcularIntensidad({ potencia, tipo, tension, factorPotencia }) {
  const errores = [];

  if (!esNumeroPositivo(potencia)) {
    errores.push("La potencia debe ser un número mayor que 0.");
  }

  if (tipo !== "monofasica" && tipo !== "trifasica") {
    errores.push("Indica si la instalación es monofásica o trifásica.");
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

  const P = Number(potencia);
  const U = Number(tension);
  const cosPhi = Number(factorPotencia);
  const factorFases = tipo === "trifasica" ? Math.sqrt(3) : 1;
  const intensidad = P / (factorFases * U * cosPhi);

  return {
    ok: true,
    intensidad: redondear(intensidad, 2),
    formula: FORMULAS[tipo],
    tipo,
  };
}
