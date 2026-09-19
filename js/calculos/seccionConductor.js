import cables from "../../data/cables.json" with { type: "json" };
import constantes from "../../data/constantes.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esFactorPotencia, esNumeroPositivo } from "../utils/validation.js";

const FORMULAS = {
  monofasica: "s = (2 · L · I · cos φ) / (γ · ΔU)",
  trifasica: "s = (√3 · L · I · cos φ) / (γ · ΔU)",
};

const FORMULAS_CAIDA = {
  monofasica: "ΔU = (2 · L · I · cos φ) / (γ · s)",
  trifasica: "ΔU = (√3 · L · I · cos φ) / (γ · s)",
};

export function calcularSeccionConductor({
  intensidad,
  tipo,
  tension,
  longitud,
  material,
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

  if (material !== "cobre" && material !== "aluminio") {
    errores.push("Indica si el conductor es de cobre o de aluminio.");
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
  const cosPhi = Number(factorPotencia);
  const gamma = cables.conductividad[material];
  const factorFases = tipo === "trifasica" ? Math.sqrt(3) : 2;
  const caidaMaximaVoltios = (U * caida) / 100;
  const seccionPorCaida = (factorFases * L * I * cosPhi) / (gamma * caidaMaximaVoltios);
  const seccionMinimaUso =
    uso === "iluminacion" ? constantes.seccionMinimaIluminacion : constantes.seccionMinimaOtros;
  const seccionMinima =
    material === "aluminio"
      ? Math.max(seccionMinimaUso, constantes.seccionMinimaAluminio)
      : seccionMinimaUso;
  const conductoresCargados = tipo === "trifasica" ? 3 : 2;
  const tablaImax = cables.intensidadMaxima[material][String(conductoresCargados)];
  const seccionesDisponibles = cables.secciones.filter(
    (seccion) => tablaImax[String(seccion)] != null,
  );

  const seccionElegida = seccionesDisponibles.find((seccion) => {
    const admiteIntensidad = tablaImax[String(seccion)] >= I;
    const cubreCaidaYMinima = seccion + 1e-9 >= Math.max(seccionPorCaida, seccionMinima);
    return admiteIntensidad && cubreCaidaYMinima;
  });

  if (seccionElegida == null) {
    return {
      ok: false,
      errores: [
        "Ninguna sección comercial de la tabla cubre la intensidad y la caída de tensión. Revisa los datos.",
      ],
    };
  }

  const intensidadMaxima = tablaImax[String(seccionElegida)];
  const caidaRealVoltios = (factorFases * L * I * cosPhi) / (gamma * seccionElegida);
  const caidaRealPorcentaje = (caidaRealVoltios / U) * 100;
  const criterio = criterioDominante(seccionPorCaida, seccionMinima, I, tablaImax);

  return {
    ok: true,
    tipo,
    material,
    formula: FORMULAS[tipo],
    formulaCaida: FORMULAS_CAIDA[tipo],
    seccion: seccionElegida,
    seccionPorCaida: redondear(seccionPorCaida, 2),
    seccionMinima,
    intensidadMaxima,
    caidaRealVoltios: redondear(caidaRealVoltios, 2),
    caidaRealPorcentaje: redondear(caidaRealPorcentaje, 2),
    criterio,
    referencia: cables.referencia,
  };
}

function criterioDominante(seccionPorCaida, seccionMinima, intensidad, tablaImax) {
  const seccionPorIntensidad =
    Object.keys(tablaImax)
      .map(Number)
      .sort((a, b) => a - b)
      .find((valor) => tablaImax[String(valor)] >= intensidad) ?? Infinity;

  if (seccionPorIntensidad > seccionPorCaida && seccionPorIntensidad > seccionMinima) {
    return "intensidad admisible";
  }

  if (seccionMinima > seccionPorCaida && seccionMinima >= seccionPorIntensidad) {
    return "sección mínima del uso";
  }

  return "caída de tensión";
}
