import { redondear } from "../utils/math.js";
import { esNumeroPositivo } from "../utils/validation.js";

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

export function calcularRadioCurvatura({ tipo, diametro }) {
  const errores = [];
  const datosTipo = TIPOS_CURVATURA.find((opcion) => opcion.id === tipo);

  if (!datosTipo) {
    errores.push("Indica el tipo de cable.");
  }

  if (!esNumeroPositivo(diametro)) {
    errores.push("El diámetro exterior debe ser un número mayor que 0.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const D = Number(diametro);
  const radio = datosTipo.k * D;

  return {
    ok: true,
    tipo: datosTipo.id,
    etiquetaTipo: datosTipo.etiqueta,
    k: datosTipo.k,
    diametro: redondear(D, 2),
    radio: redondear(radio, 2),
    formula: FORMULA,
  };
}
