import tubos from "../../data/tubos.json" with { type: "json" };
import { redondear } from "../utils/math.js";

const FORMULA = "R = k · D";

export const TIPOS_CURVATURA = [
  {
    id: "unipolar-sin-cubierta",
    etiqueta: "Conductores unipolares sin cubierta",
    k: 4,
  },
  {
    id: "multipolar-menor-16",
    etiqueta: "Cables multipolares con cubierta, sección menor de 16 mm²",
    k: 5,
  },
  {
    id: "multipolar-desde-16",
    etiqueta: "Cables multipolares con cubierta, sección mayor o igual a 16 mm²",
    k: 10,
  },
];

export function calcularRadioCurvatura({ tipo, seccion }) {
  const errores = [];
  const datosTipo = TIPOS_CURVATURA.find((opcion) => opcion.id === tipo);
  const conductor = conductorDe(seccion);

  if (!datosTipo) {
    errores.push("Indica el tipo de cable.");
  }

  if (!conductor) {
    errores.push("La sección debe ser una de la tabla de diámetros exteriores.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const radio = datosTipo.k * conductor.diametro;

  return {
    ok: true,
    tipo: datosTipo.id,
    etiquetaTipo: datosTipo.etiqueta,
    k: datosTipo.k,
    seccion: conductor.seccion,
    diametro: redondear(conductor.diametro, 2),
    radio: redondear(radio, 2),
    formula: FORMULA,
  };
}

function conductorDe(seccion) {
  const valor = Number(seccion);
  return tubos.conductores.find((conductor) => Math.abs(conductor.seccion - valor) < 1e-9);
}
