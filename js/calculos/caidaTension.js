import cables from "../../data/cables.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esFactorPotencia, esNumeroPositivo } from "../utils/validation.js";

const FORMULAS = {
  monofasica: "ΔU = (2 · L · I · cos φ) / (γ · s)",
  trifasica: "ΔU = (√3 · L · I · cos φ) / (γ · s)",
};

export function calcularCaidaTension({
  intensidad,
  tipo,
  tension,
  longitud,
  seccion,
  material,
  aislante,
  uso,
  caidaMaxima,
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

  if (uso !== "iluminacion" && uso !== "otros") {
    errores.push("Indica el uso de la línea (iluminación u otros usos).");
  }

  const caida = Number(caidaMaxima);
  if (!Number.isFinite(caida) || caida <= 0 || caida > 100) {
    errores.push("La caída de tensión máxima debe estar entre 0 (no incluido) y 100 %.");
  }

  if (!esFactorPotencia(factorPotencia)) {
    errores.push("El factor de potencia (cos φ) debe estar entre 0 (no incluido) y 1.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const I = Number(intensidad);
  const U = Number(tension);
  const L = Number(longitud);
  const s = Number(seccion);
  const cosPhi = Number(factorPotencia);
  const datosAislante = cables.aislantes[aislante];
  const gamma = conductividadServicio(material, aislante);
  const factorFases = tipo === "trifasica" ? Math.sqrt(3) : 2;
  const caidaVoltios = (factorFases * L * I * cosPhi) / (gamma * s);
  const caidaPorcentaje = (caidaVoltios / U) * 100;
  const cumple = caidaPorcentaje <= caida + 1e-9;

  return {
    ok: true,
    tipo,
    material,
    aislante,
    etiquetaAislante: datosAislante.etiqueta,
    temperaturaServicio: datosAislante.temperatura,
    gamma: redondear(gamma, 2),
    formula: FORMULAS[tipo],
    caidaVoltios: redondear(caidaVoltios, 2),
    caidaPorcentaje: redondear(caidaPorcentaje, 2),
    caidaMaxima: caida,
    cumple,
  };
}

function conductividadServicio(material, aislante) {
  const gamma20 = cables.conductividad[material];
  const alfa = cables.coeficienteTemperatura[material];
  const temperatura = cables.aislantes[aislante].temperatura;
  return gamma20 / (1 + alfa * (temperatura - 20));
}
