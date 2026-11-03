import datos from "../../data/resistenciaTierra.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esEnteroPositivo, esNumeroPositivo } from "../utils/validation.js";

const FACTOR_PLACA = datos.electrodos.placa.factor;

const FORMULAS = {
  anillo: "R = (2 · ρ) / L",
  picas: "R = ρ / (n · L)",
  placa: "R = (0,8 · ρ) / P",
};

const ETIQUETAS = {
  anillo: "Anillo de cable desnudo",
  picas: "Picas verticales",
  placa: "Placa enterrada",
};

export function calcularResistenciaTierraInterior({ tipo, resistividad, longitud, numeroPicas, perimetro }) {
  const errores = [];
  const esPicas = tipo === "picas";
  const esPlaca = tipo === "placa";

  if (!ETIQUETAS[tipo]) {
    errores.push("Indica si la tierra es un anillo de cable desnudo, picas verticales o una placa enterrada.");
  }

  if (!esNumeroPositivo(resistividad)) {
    errores.push("La resistividad del terreno debe ser un número mayor que 0.");
  }

  if (esPlaca) {
    if (!esNumeroPositivo(perimetro)) {
      errores.push("El perímetro de la placa debe ser un número mayor que 0.");
    }
  } else if (ETIQUETAS[tipo] && !esNumeroPositivo(longitud)) {
    errores.push(
      esPicas
        ? "La longitud de la pica debe ser un número mayor que 0."
        : "La longitud del cable debe ser un número mayor que 0.",
    );
  }

  if (esPicas && !esEnteroPositivo(numeroPicas)) {
    errores.push("El número de picas debe ser un entero mayor que 0.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const rho = Number(resistividad);
  const L = esPlaca ? 0 : Number(longitud);
  const P = esPlaca ? Number(perimetro) : 0;
  const n = esPicas ? Number(numeroPicas) : 1;
  const resistencia = esPlaca ? (FACTOR_PLACA * rho) / P : esPicas ? rho / (n * L) : (2 * rho) / L;

  return {
    ok: true,
    tipo,
    etiquetaTipo: ETIQUETAS[tipo],
    resistividad: redondear(rho, 2),
    longitud: redondear(L, 2),
    perimetro: redondear(P, 2),
    numeroPicas: n,
    resistencia: redondear(resistencia, 2),
    formula: FORMULAS[tipo],
  };
}
