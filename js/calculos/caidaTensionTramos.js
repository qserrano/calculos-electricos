import cables from "../../data/cables.json" with { type: "json" };
import constantes from "../../data/constantes.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esNumeroPositivo } from "../utils/validation.js";

const FORMULAS = {
  monofasica: "ΔU = Σ (2 · L · P) / (γ · s · U), con P = Paplicada + Paguas abajo",
  trifasica: "ΔU = Σ (L · P) / (γ · s · U), con P = Paplicada + Paguas abajo",
};

export function calcularCaidaTensionTramos({
  tipo,
  tension,
  material,
  aislante,
  uso,
  caidaMaxima,
  tramos,
}) {
  const errores = [];

  if (tipo !== "monofasica" && tipo !== "trifasica") {
    errores.push("Indica si el suministro es monofásico o trifásico.");
  }

  if (!esNumeroPositivo(tension)) {
    errores.push("La tensión debe ser un número mayor que 0.");
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

  if (!Array.isArray(tramos) || tramos.length === 0) {
    errores.push("Añade al menos un tramo.");
  }

  const minima = material === "aluminio" ? constantes.seccionMinimaAluminio : 0;
  const seccionesValidas = cables.secciones.filter((seccion) => seccion >= minima);

  if (Array.isArray(tramos)) {
    tramos.forEach((tramo, indice) => {
      const numero = indice + 1;
      if (!esNumeroPositivo(tramo.potencia)) {
        errores.push(`La potencia del tramo ${numero} debe ser un número mayor que 0.`);
      }
      if (!esNumeroPositivo(tramo.longitud)) {
        errores.push(`La longitud del tramo ${numero} debe ser un número mayor que 0.`);
      }
      if (!seccionesValidas.some((seccion) => Math.abs(seccion - Number(tramo.seccion)) < 1e-9)) {
        errores.push(`La sección del tramo ${numero} no es válida para el material elegido.`);
      }
    });
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const U = Number(tension);
  const gamma = conductividadServicio(material, aislante);
  const factor = tipo === "trifasica" ? 1 : 2;
  const datosAislante = cables.aislantes[aislante];
  const potenciasAplicadas = tramos.map((tramo) => Number(tramo.potencia));
  const detalle = tramos.map((tramo, indice) => {
    const potenciaAplicada = potenciasAplicadas[indice];
    const potencia = potenciasAplicadas.slice(indice).reduce((suma, valor) => suma + valor, 0);
    const longitud = Number(tramo.longitud);
    const seccion = Number(tramo.seccion);
    const caidaTramo = (factor * longitud * potencia) / (gamma * seccion * U);
    return {
      potenciaAplicada: redondear(potenciaAplicada, 2),
      potencia: redondear(potencia, 2),
      longitud: redondear(longitud, 2),
      seccion,
      caidaVoltios: redondear(caidaTramo, 2),
    };
  });
  const caidaVoltios = redondear(
    detalle.reduce((suma, tramo) => suma + tramo.caidaVoltios, 0),
    2,
  );
  const caidaPorcentaje = (caidaVoltios / U) * 100;

  return {
    ok: true,
    tipo,
    material,
    etiquetaAislante: datosAislante.etiqueta,
    temperaturaServicio: datosAislante.temperatura,
    gamma: redondear(gamma, 2),
    tension: U,
    tramos: detalle,
    caidaVoltios,
    caidaPorcentaje: redondear(caidaPorcentaje, 2),
    caidaMaxima: caida,
    cumple: caidaPorcentaje <= caida + 1e-9,
    formula: FORMULAS[tipo],
  };
}

function conductividadServicio(material, aislante) {
  const gamma20 = cables.conductividad[material];
  const alfa = cables.coeficienteTemperatura[material];
  const temperatura = cables.aislantes[aislante].temperatura;
  return gamma20 / (1 + alfa * (temperatura - 20));
}
