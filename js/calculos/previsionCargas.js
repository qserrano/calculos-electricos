import datos from "../../data/previsionCargas.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esEnteroNoNegativo, esNumeroNoNegativo, esNumeroPositivo } from "../utils/validation.js";

export function calcularPrevisionCargas({
  viviendasBasicas,
  viviendasElevadas,
  potenciaServicios,
  superficiesLocales,
  tarifaNocturna,
}) {
  const errores = [];
  const nBasicas = viviendasBasicas === "" || viviendasBasicas == null ? 0 : Number(viviendasBasicas);
  const nElevadas = viviendasElevadas === "" || viviendasElevadas == null ? 0 : Number(viviendasElevadas);
  const servicios = potenciaServicios === "" || potenciaServicios == null ? 0 : Number(potenciaServicios);
  const superficies = Array.isArray(superficiesLocales) ? superficiesLocales : [];

  if (!esEnteroNoNegativo(viviendasBasicas)) {
    errores.push("El número de viviendas con electrificación básica debe ser un entero mayor o igual que 0.");
  }

  if (!esEnteroNoNegativo(viviendasElevadas)) {
    errores.push("El número de viviendas con electrificación elevada debe ser un entero mayor o igual que 0.");
  }

  if (!esNumeroNoNegativo(potenciaServicios)) {
    errores.push("La potencia de servicios generales debe ser un número mayor o igual que 0.");
  }

  const nViviendas = nBasicas + nElevadas;
  if (errores.length === 0 && nViviendas < 1) {
    errores.push("Indica al menos una vivienda (básica o elevada).");
  }

  const locales = [];
  superficies.forEach((superficie, indice) => {
    if (!esNumeroPositivo(superficie)) {
      errores.push(`La superficie útil del local ${indice + 1} debe ser un número mayor que 0.`);
      return;
    }
    const metros = Number(superficie);
    const potencia = Math.max(metros * datos.densidadLocales, datos.minimoLocal);
    locales.push({
      superficie: metros,
      potencia,
      aplicaMinimo: potencia === datos.minimoLocal,
    });
  });

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const potenciaMedia = (nBasicas * datos.potenciaBasica + nElevadas * datos.potenciaElevada) / nViviendas;
  const coeficiente = coeficienteSimultaneidad(nViviendas, tarifaNocturna === true || tarifaNocturna === "si");
  const potenciaViviendas = coeficiente * potenciaMedia;
  const potenciaLocales = locales.reduce((total, local) => total + local.potencia, 0);
  const potenciaTotal = potenciaViviendas + servicios + potenciaLocales;

  return {
    ok: true,
    nBasicas,
    nElevadas,
    nViviendas,
    potenciaMedia: redondear(potenciaMedia, 2),
    coeficiente: redondear(coeficiente, 2),
    potenciaViviendas: redondear(potenciaViviendas, 2),
    potenciaServicios: redondear(servicios, 2),
    locales: locales.map((local) => ({
      ...local,
      superficie: redondear(local.superficie, 2),
      potencia: redondear(local.potencia, 2),
    })),
    potenciaLocales: redondear(potenciaLocales, 2),
    potenciaTotal: redondear(potenciaTotal, 2),
    potenciaTotalKw: redondear(potenciaTotal / 1000, 3),
    tarifaNocturna: tarifaNocturna === true || tarifaNocturna === "si",
    formula: "P = Cs · Pmedia + Psg + Plc",
    referencia: datos.referencia,
  };
}

function coeficienteSimultaneidad(n, tarifaNocturna) {
  if (tarifaNocturna) {
    return n;
  }

  if (n <= datos.simultaneidad.length) {
    return datos.simultaneidad[n - 1];
  }

  return 15.3 + (n - 21) * 0.5;
}
