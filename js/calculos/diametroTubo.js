import tubos from "../../data/tubos.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esEnteroPositivo } from "../utils/validation.js";

const FORMULA = "D = 2 · √(S / π)";

export function calcularDiametroTubo({ instalacion, conductores }) {
  const errores = [];
  const datosInstalacion = tubos.instalaciones[instalacion];

  if (!datosInstalacion) {
    errores.push("Indica el sistema de instalación (superficie, empotrada o al aire).");
  }

  if (!Array.isArray(conductores) || conductores.length === 0) {
    errores.push("Añade al menos un grupo de conductores.");
  } else {
    conductores.forEach((grupo, indice) => {
      const numero = indice + 1;
      if (!conductorDe(grupo.seccion)) {
        errores.push(`La sección del grupo ${numero} debe ser una de la tabla de diámetros exteriores.`);
      }
      if (!esEnteroPositivo(grupo.cantidad)) {
        errores.push(`La cantidad del grupo ${numero} debe ser un entero mayor que 0.`);
      }
    });
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const grupos = conductores.map((grupo) => {
    const conductor = conductorDe(grupo.seccion);
    const cantidad = Number(grupo.cantidad);
    const seccionExterior = Math.PI * (conductor.diametro / 2) ** 2;
    return {
      seccion: conductor.seccion,
      diametro: conductor.diametro,
      cantidad,
      seccionOcupada: seccionExterior * cantidad,
    };
  });

  const seccionOcupada = grupos.reduce((suma, grupo) => suma + grupo.seccionOcupada, 0);
  const seccionTubo = seccionOcupada * datosInstalacion.factor;
  const diametroCalculado = redondear(2 * Math.sqrt(seccionTubo / Math.PI), 2);
  const serie = tubos.tubos[datosInstalacion.tubo];
  const elegido = serie.diametros.find(
    (tubo) => redondear(tubo.interior, 2) + 1e-9 >= diametroCalculado,
  );

  if (!elegido) {
    return {
      ok: false,
      errores: [
        `Ningún ${serie.etiqueta.toLowerCase()} cubre el diámetro interior de ${diametroCalculado.toFixed(2)} mm.`,
      ],
    };
  }

  return {
    ok: true,
    instalacion,
    etiquetaInstalacion: datosInstalacion.etiqueta,
    factor: datosInstalacion.factor,
    etiquetaTubo: serie.etiqueta,
    diametroComercial: elegido.comercial,
    diametroInteriorTubo: elegido.interior,
    diametroCalculado,
    seccionOcupada: redondear(seccionOcupada, 2),
    seccionTubo: redondear(seccionTubo, 2),
    conductores: grupos.map((grupo) => ({
      ...grupo,
      diametro: redondear(grupo.diametro, 2),
      seccionOcupada: redondear(grupo.seccionOcupada, 2),
    })),
    formula: FORMULA,
  };
}

function conductorDe(seccion) {
  const valor = Number(seccion);
  return tubos.conductores.find((conductor) => Math.abs(conductor.seccion - valor) < 1e-9);
}
