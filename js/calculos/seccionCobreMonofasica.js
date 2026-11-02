import cables from "../../data/cables.json" with { type: "json" };
import constantes from "../../data/constantes.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esNumeroPositivo } from "../utils/validation.js";

const FORMULA = "s = (2 · L · P) / (γ · U · ΔU)";
const MATERIAL = "cobre";

const CAIDA_POR_USO = {
  iluminacion: constantes.caidaTensionIluminacion,
  otros: constantes.caidaTensionOtros,
};

export function calcularSeccionCobreMonofasica({ potencia, longitud, aislante, uso }) {
  const errores = [];

  if (!esNumeroPositivo(potencia)) {
    errores.push("La potencia debe ser un número mayor que 0.");
  }

  if (!esNumeroPositivo(longitud)) {
    errores.push("La longitud debe ser un número mayor que 0.");
  }

  if (!cables.aislantes[aislante]) {
    errores.push("Indica el tipo de aislante del cable (PVC o XLPE / EPR).");
  }

  if (uso !== "iluminacion" && uso !== "otros") {
    errores.push("Indica el uso del circuito (alumbrado u otros usos).");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const P = Number(potencia);
  const L = Number(longitud);
  const U = constantes.tensionMonofasica;
  const datosAislante = cables.aislantes[aislante];
  const gamma = conductividadServicio(aislante);
  const caida = CAIDA_POR_USO[uso];
  const caidaMaximaVoltios = (U * caida) / 100;
  const seccionCalculada = (2 * L * P) / (gamma * U * caidaMaximaVoltios);
  const seccion = cables.secciones.find((valor) => valor + 1e-9 >= seccionCalculada);

  if (seccion == null) {
    return {
      ok: false,
      errores: [
        "Ninguna sección comercial de la serie cubre la caída de tensión permitida. Revisa los datos.",
      ],
    };
  }

  const caidaRealVoltios = (2 * L * P) / (gamma * U * seccion);
  const caidaRealPorcentaje = (caidaRealVoltios / U) * 100;

  return {
    ok: true,
    potencia: redondear(P, 2),
    longitud: redondear(L, 2),
    tension: U,
    aislante,
    etiquetaAislante: datosAislante.etiqueta,
    temperaturaServicio: datosAislante.temperatura,
    gamma: redondear(gamma, 2),
    uso,
    etiquetaUso: uso === "iluminacion" ? "Alumbrado" : "Otros usos",
    seccion,
    seccionCalculada: redondear(seccionCalculada, 2),
    caidaMaxima: caida,
    caidaMaximaVoltios: redondear(caidaMaximaVoltios, 2),
    caidaRealVoltios: redondear(caidaRealVoltios, 2),
    caidaRealPorcentaje: redondear(caidaRealPorcentaje, 2),
    formula: FORMULA,
  };
}

function conductividadServicio(aislante) {
  const gamma20 = cables.conductividad[MATERIAL];
  const alfa = cables.coeficienteTemperatura[MATERIAL];
  const temperatura = cables.aislantes[aislante].temperatura;
  return gamma20 / (1 + alfa * (temperatura - 20));
}
