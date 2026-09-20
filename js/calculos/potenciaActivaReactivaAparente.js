import { redondear } from "../utils/math.js";
import { esFactorPotencia, esNumeroPositivo } from "../utils/validation.js";

const FORMULAS = {
  monofasica: [
    "P = U · I · cos φ",
    "Q = U · I · sen φ",
    "S = U · I",
  ],
  trifasica: [
    "P = √3 · U · I · cos φ",
    "Q = √3 · U · I · sen φ",
    "S = √3 · U · I",
  ],
};

export function calcularPotenciaActivaReactivaAparente({
  intensidad,
  tipo,
  tension,
  factorPotencia,
}) {
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
  const senPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi));
  const factorFases = tipo === "trifasica" ? Math.sqrt(3) : 1;
  const aparente = factorFases * U * I;
  const activa = aparente * cosPhi;
  const reactiva = aparente * senPhi;

  return {
    ok: true,
    activa: redondear(activa, 2),
    reactiva: redondear(reactiva, 2),
    aparente: redondear(aparente, 2),
    senPhi: redondear(senPhi, 4),
    cosPhi: redondear(cosPhi, 4),
    formula: FORMULAS[tipo],
    tipo,
  };
}
