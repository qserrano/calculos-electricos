import datos from "../../data/resistenciaTierra.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esEnteroPositivo, esNumeroPositivo } from "../utils/validation.js";

export function calcularResistenciaTierra({ electrodo, resistividad, longitud, numeroPicas }) {
  const errores = [];
  const tipo = datos.electrodos[electrodo];
  const esPica = electrodo === "pica";
  const nBruto = numeroPicas === "" || numeroPicas == null ? 1 : Number(numeroPicas);
  const n = esPica ? nBruto : 1;

  if (!tipo) {
    errores.push("Indica si el electrodo es una pica vertical o un conductor enterrado.");
  }

  if (!esNumeroPositivo(resistividad)) {
    errores.push("La resistividad del terreno debe ser un número mayor que 0.");
  }

  if (!esNumeroPositivo(longitud)) {
    errores.push("La longitud del electrodo debe ser un número mayor que 0.");
  }

  if (esPica && !esEnteroPositivo(nBruto)) {
    errores.push("El número de picas debe ser un entero mayor o igual que 1.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const rho = Number(resistividad);
  const L = Number(longitud);
  const resistenciaUna = (tipo.factor * rho) / L;
  const resistencia = resistenciaUna / n;
  const enParalelo = esPica && n > 1;
  const separacionMinima = datos.separacionMinimaEnLongitudes * L;

  return {
    ok: true,
    electrodo,
    etiquetaElectrodo: tipo.etiqueta,
    resistividad: redondear(rho, 2),
    longitud: redondear(L, 2),
    numeroPicas: n,
    resistenciaUna: redondear(resistenciaUna, 2),
    resistencia: redondear(resistencia, 2),
    separacionMinima: redondear(separacionMinima, 2),
    enParalelo,
    formula: enParalelo ? tipo.formulaParalelo : tipo.formula,
    referencia: datos.referencia,
  };
}
