import datos from "../../data/resistenciaTierra.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esNumeroPositivo } from "../utils/validation.js";

export function calcularResistenciaTierra({ electrodo, resistividad, longitud }) {
  const errores = [];
  const tipo = datos.electrodos[electrodo];

  if (!tipo) {
    errores.push("Indica si el electrodo es una pica vertical o un conductor enterrado.");
  }

  if (!esNumeroPositivo(resistividad)) {
    errores.push("La resistividad del terreno debe ser un número mayor que 0.");
  }

  if (!esNumeroPositivo(longitud)) {
    errores.push("La longitud del electrodo debe ser un número mayor que 0.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const rho = Number(resistividad);
  const L = Number(longitud);
  const resistencia = (tipo.factor * rho) / L;

  return {
    ok: true,
    electrodo,
    etiquetaElectrodo: tipo.etiqueta,
    resistividad: redondear(rho, 2),
    longitud: redondear(L, 2),
    resistencia: redondear(resistencia, 2),
    formula: tipo.formula,
    referencia: datos.referencia,
  };
}
