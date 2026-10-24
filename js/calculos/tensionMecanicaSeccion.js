import cables from "../../data/cables.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esNumeroPositivo } from "../utils/validation.js";

const FORMULA = "σ = T / s";

export function calcularTensionMecanicaSeccion({ tension, seccion }) {
  const errores = [];

  if (!esNumeroPositivo(tension)) {
    errores.push("La tensión mecánica debe ser un número mayor que 0.");
  }

  if (!esSeccionNeutroRZ(seccion)) {
    errores.push("La sección debe ser la del neutro de un trenzado RZ: 29,5, 55,6 u 80 mm².");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const t = Number(tension);
  const s = Number(seccion);

  return {
    ok: true,
    tension: redondear(t, 2),
    seccion: s,
    tensionUnitaria: redondear(t / s, 4),
    formula: FORMULA,
  };
}

function esSeccionNeutroRZ(seccion) {
  const valor = Number(seccion);
  return cables.seccionesNeutroRZ.some((admitida) => Math.abs(admitida - valor) < 1e-9);
}
