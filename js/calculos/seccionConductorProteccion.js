import { redondear } from "../utils/math.js";
import { esNumeroPositivo } from "../utils/validation.js";

const FORMULA = "Smin = √(Icc² · t) / k";

export const TIPOS_PROTECCION = [
  { id: "pvc", etiqueta: "Aislamiento PVC", k: 115 },
  { id: "xlpe", etiqueta: "Aislamiento XLPE", k: 143 },
  { id: "desnudo", etiqueta: "Cable desnudo de cobre", k: 159 },
];

export function calcularSeccionConductorProteccion({ tipo, corrienteCortocircuito, tiempo }) {
  const errores = [];
  const datosTipo = TIPOS_PROTECCION.find((opcion) => opcion.id === tipo);

  if (!datosTipo) {
    errores.push("Indica el tipo de conductor de protección.");
  }

  if (!esNumeroPositivo(corrienteCortocircuito)) {
    errores.push("La corriente de cortocircuito (Icc) debe ser un número mayor que 0.");
  }

  if (!esNumeroPositivo(tiempo)) {
    errores.push("El tiempo de disparo (t) debe ser un número mayor que 0.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const icc = Number(corrienteCortocircuito);
  const t = Number(tiempo);
  const seccion = Math.sqrt(icc ** 2 * t) / datosTipo.k;

  return {
    ok: true,
    tipo,
    etiquetaTipo: datosTipo.etiqueta,
    k: datosTipo.k,
    corrienteCortocircuito: redondear(icc, 2),
    tiempo: redondear(t, 2),
    seccion: redondear(seccion, 2),
    formula: FORMULA,
  };
}
