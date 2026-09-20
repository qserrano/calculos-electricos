import datos from "../../data/resistenciaTierra.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esEnteroPositivo, esNumeroPositivo } from "../utils/validation.js";

export function calcularResistenciaTierra({ electrodo, resistividad, longitud, perimetro, numeroPicas }) {
  const errores = [];
  const tipo = datos.electrodos[electrodo];
  const esPica = electrodo === "pica";
  const usaPerimetro = tipo?.usaPerimetro === true;
  const nBruto = numeroPicas === "" || numeroPicas == null ? 1 : Number(numeroPicas);
  const n = esPica ? nBruto : 1;
  const medida = usaPerimetro ? perimetro : longitud;

  if (!tipo) {
    errores.push("Indica si el electrodo es una pica vertical, un conductor enterrado o una placa.");
  }

  if (!esNumeroPositivo(resistividad)) {
    errores.push("La resistividad del terreno debe ser un número mayor que 0.");
  }

  if (usaPerimetro) {
    if (!esNumeroPositivo(perimetro)) {
      errores.push("El perímetro de la placa debe ser un número mayor que 0.");
    }
  } else if (tipo && !esNumeroPositivo(longitud)) {
    errores.push("La longitud del electrodo debe ser un número mayor que 0.");
  }

  if (esPica && !esEnteroPositivo(nBruto)) {
    errores.push("El número de picas debe ser un entero mayor o igual que 1.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const rho = Number(resistividad);
  const valorMedida = Number(medida);
  const resistenciaUna = (tipo.factor * rho) / valorMedida;
  const resistencia = resistenciaUna / n;
  const enParalelo = esPica && n > 1;
  const separacionMinima = datos.separacionMinimaEnLongitudes * valorMedida;
  const tensionContacto = resistencia * datos.intensidadDefecto;

  return {
    ok: true,
    electrodo,
    etiquetaElectrodo: tipo.etiqueta,
    resistividad: redondear(rho, 2),
    usaPerimetro,
    etiquetaMedida: usaPerimetro ? "P" : "L",
    medida: redondear(valorMedida, 2),
    numeroPicas: n,
    resistenciaUna: redondear(resistenciaUna, 2),
    resistencia: redondear(resistencia, 2),
    tensionContacto: redondear(tensionContacto, 2),
    intensidadDefectoMa: redondear(datos.intensidadDefecto * 1000, 0),
    separacionMinima: redondear(separacionMinima, 2),
    enParalelo,
    formula: enParalelo ? tipo.formulaParalelo : tipo.formula,
    formulaContacto: datos.formulaContacto,
    referencia: datos.referencia,
  };
}
