import cables from "../../data/cables.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esEnteroPositivo } from "../utils/validation.js";

const FORMULA = "F = σ · s · n";
const MATERIAL = "cobre";

export function calcularEsfuerzoTraccion({ seccion, conductores }) {
  const errores = [];

  if (!esSeccionComercial(seccion)) {
    errores.push("La sección debe ser una de la serie comercial del conductor.");
  }

  if (!esEnteroPositivo(conductores)) {
    errores.push("El número de conductores debe ser un entero mayor que 0.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const s = Number(seccion);
  const n = Number(conductores);
  const sigma = cables.tensionMecanicaMaxima[MATERIAL];
  const fuerza = sigma * s * n;

  return {
    ok: true,
    sigma,
    seccion: s,
    conductores: n,
    fuerza: redondear(fuerza, 2),
    formula: FORMULA,
  };
}

function esSeccionComercial(seccion) {
  const valor = Number(seccion);
  return cables.secciones.some((admitida) => Math.abs(admitida - valor) < 1e-9);
}
