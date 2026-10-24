import { redondear } from "../utils/math.js";
import { esNumeroPositivo } from "../utils/validation.js";

const FORMULA = "E = Ur / e";

export function calcularRigidezDielectrica({ tension, espesor }) {
  const errores = [];

  if (!esNumeroPositivo(tension)) {
    errores.push("La tensión de rotura debe ser un número mayor que 0.");
  }

  if (!esNumeroPositivo(espesor)) {
    errores.push("El espesor del aislante debe ser un número mayor que 0.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const u = Number(tension);
  const e = Number(espesor);
  const rigidez = u / e;

  return {
    ok: true,
    tension: redondear(u, 2),
    espesor: redondear(e, 3),
    rigidez: redondear(rigidez, 2),
    rigidezKilovoltios: redondear(rigidez / 1000, 4),
    formula: FORMULA,
  };
}
