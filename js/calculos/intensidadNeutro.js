import cables from "../../data/cables.json" with { type: "json" };
import constantes from "../../data/constantes.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esNumeroFinitoNoNegativo, esNumeroPositivo } from "../utils/validation.js";

const FORMULA_NEUTRO = "In = √(I1² + I2² + I3² − I1·I2 − I1·I3 − I2·I3)";
const FORMULA_RESISTENCIA = "R = L / (γ · s)";
const FORMULA_CAIDA = "ΔV = IL · R + IN · R";

export function calcularIntensidadNeutro({
  intensidadL1,
  intensidadL2,
  intensidadL3,
  longitud,
  seccion,
  material,
  aislante,
}) {
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

  if (!esNumeroPositivo(longitud)) {
    errores.push("La longitud debe ser un número mayor que 0.");
  }

  if (!esNumeroPositivo(seccion)) {
    errores.push("La sección debe ser un número mayor que 0.");
  }

  if (material !== "cobre" && material !== "aluminio") {
    errores.push("Indica si el conductor es de cobre o de aluminio.");
  }

  if (!cables.aislantes[aislante]) {
    errores.push("Indica el tipo de aislante del cable (PVC o XLPE / EPR).");
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

  const L = Number(longitud);
  const s = Number(seccion);
  const datosAislante = cables.aislantes[aislante];
  const gamma = conductividadServicio(material, aislante);
  const resistencia = L / (gamma * s);
  const intensidadNeutro = Math.sqrt(Math.max(0, I1 * I1 + I2 * I2 + I3 * I3 - I1 * I2 - I1 * I3 - I2 * I3));
  const intensidadMaxima = Math.max(I1, I2, I3);
  const fasesMaximas = [
    { fase: "L1", intensidad: I1 },
    { fase: "L2", intensidad: I2 },
    { fase: "L3", intensidad: I3 },
  ]
    .filter((fase) => Math.abs(fase.intensidad - intensidadMaxima) < 1e-9)
    .map((fase) => fase.fase);
  const caidaFase = intensidadMaxima * resistencia;
  const caidaNeutro = intensidadNeutro * resistencia;
  const caidaVoltios = caidaFase + caidaNeutro;
  const tensionFase = constantes.tensionMonofasica;
  const caidaPorcentaje = (caidaVoltios / tensionFase) * 100;

  return {
    ok: true,
    material,
    aislante,
    etiquetaAislante: datosAislante.etiqueta,
    temperaturaServicio: datosAislante.temperatura,
    gamma: redondear(gamma, 2),
    resistencia: redondear(resistencia, 4),
    intensidadL1: redondear(I1, 2),
    intensidadL2: redondear(I2, 2),
    intensidadL3: redondear(I3, 2),
    intensidadNeutro: redondear(intensidadNeutro, 2),
    intensidadMaxima: redondear(intensidadMaxima, 2),
    fasesMaximas,
    caidaFase: redondear(caidaFase, 2),
    caidaNeutro: redondear(caidaNeutro, 2),
    tensionFase,
    caidaVoltios: redondear(caidaVoltios, 2),
    caidaPorcentaje: redondear(caidaPorcentaje, 2),
    formulaNeutro: FORMULA_NEUTRO,
    formulaResistencia: FORMULA_RESISTENCIA,
    formulaCaida: FORMULA_CAIDA,
  };
}

function conductividadServicio(material, aislante) {
  const gamma20 = cables.conductividad[material];
  const alfa = cables.coeficienteTemperatura[material];
  const temperatura = cables.aislantes[aislante].temperatura;
  return gamma20 / (1 + alfa * (temperatura - 20));
}
