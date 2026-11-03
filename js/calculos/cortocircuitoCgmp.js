import cables from "../../data/cables.json" with { type: "json" };
import constantes from "../../data/constantes.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esNumeroPositivo } from "../utils/validation.js";

const FACTOR_TENSION = 0.8;

const FORMULAS = {
  monofasica: "Icc = 0,8 · U / R",
  trifasica: "Icc = 0,8 · U / (√3 · R)",
};

const FORMULAS_RESISTENCIA = {
  monofasica: "R = 2 · L / (γ · s)",
  trifasica: "R = L / (γ · s)",
};

export function calcularCortocircuitoCgmp({
  tipo,
  materialLga,
  longitudLga,
  seccionLga,
  materialDi,
  longitudDi,
  seccionDi,
}) {
  const errores = [];
  const esTrifasica = tipo === "trifasica";

  if (tipo !== "monofasica" && tipo !== "trifasica") {
    errores.push("Indica si el suministro es monofásico o trifásico.");
  }

  validarLinea(errores, "LGA", materialLga, longitudLga, seccionLga);
  validarLinea(errores, "derivación individual", materialDi, longitudDi, seccionDi);

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const tension = esTrifasica ? constantes.tensionTrifasica : constantes.tensionMonofasica;
  const factorConductores = esTrifasica ? 1 : 2;
  const lga = resistenciaLinea(materialLga, longitudLga, seccionLga, factorConductores);
  const di = resistenciaLinea(materialDi, longitudDi, seccionDi, factorConductores);
  const resistencia = lga.resistencia + di.resistencia;
  const denominador = esTrifasica ? Math.sqrt(3) * resistencia : resistencia;
  const intensidad = (FACTOR_TENSION * tension) / denominador;

  return {
    ok: true,
    tipo,
    etiquetaTipo: esTrifasica ? "Trifásico" : "Monofásico",
    tension,
    factorTension: FACTOR_TENSION,
    gammaLga: lga.gamma,
    gammaDi: di.gamma,
    materialLga,
    materialDi,
    longitudLga: redondear(lga.longitud, 2),
    longitudDi: redondear(di.longitud, 2),
    seccionLga: lga.seccion,
    seccionDi: di.seccion,
    resistenciaLga: redondear(lga.resistencia, 4),
    resistenciaDi: redondear(di.resistencia, 4),
    resistencia: redondear(resistencia, 4),
    intensidad: redondear(intensidad, 2),
    formula: FORMULAS[tipo],
    formulaResistencia: FORMULAS_RESISTENCIA[tipo],
  };
}

function validarLinea(errores, nombre, material, longitud, seccion) {
  if (material !== "cobre" && material !== "aluminio") {
    errores.push(`Indica si la ${nombre} es de cobre o de aluminio.`);
  }

  if (!esNumeroPositivo(longitud)) {
    errores.push(`La longitud de la ${nombre} debe ser un número mayor que 0.`);
  }

  if (material === "cobre" || material === "aluminio") {
    if (!seccionAdmitida(seccion, material)) {
      errores.push(`La sección de la ${nombre} debe ser una de la serie comercial del material.`);
    }
  }
}

function seccionAdmitida(seccion, material) {
  const valor = Number(seccion);
  const minima = material === "aluminio" ? constantes.seccionMinimaAluminio : 0;

  return cables.secciones.some(
    (candidata) => candidata + 1e-9 >= minima && Math.abs(candidata - valor) < 1e-9,
  );
}

function resistenciaLinea(material, longitud, seccion, factorConductores) {
  const gamma = cables.conductividad[material];
  const L = Number(longitud);
  const s = cables.secciones.find((candidata) => Math.abs(candidata - Number(seccion)) < 1e-9);

  return {
    gamma,
    longitud: L,
    seccion: s,
    resistencia: (factorConductores * L) / (gamma * s),
  };
}
