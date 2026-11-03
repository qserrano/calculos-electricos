import datos from "../../data/previsionCargas.json" with { type: "json" };
import recarga from "../../data/itcBt52.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esEnteroNoNegativo, esNumeroPositivo } from "../utils/validation.js";

export function calcularPrevisionCargas({
  viviendasBasicas,
  viviendasElevadas,
  receptores,
  superficiesLocales,
  garajes,
  estacionesRecarga,
  tarifaNocturna,
}) {
  const errores = [];
  const nBasicas = viviendasBasicas === "" || viviendasBasicas == null ? 0 : Number(viviendasBasicas);
  const nElevadas = viviendasElevadas === "" || viviendasElevadas == null ? 0 : Number(viviendasElevadas);
  const listaReceptores = Array.isArray(receptores) ? receptores : [];
  const superficies = Array.isArray(superficiesLocales) ? superficiesLocales : [];
  const listaGarajes = Array.isArray(garajes) ? garajes : [];
  const nEstaciones = estacionesRecarga === "" || estacionesRecarga == null ? 0 : Number(estacionesRecarga);

  if (!esEnteroNoNegativo(viviendasBasicas)) {
    errores.push("El número de viviendas con electrificación básica debe ser un entero mayor o igual que 0.");
  }

  if (!esEnteroNoNegativo(viviendasElevadas)) {
    errores.push("El número de viviendas con electrificación elevada debe ser un entero mayor o igual que 0.");
  }

  const servicios = [];
  listaReceptores.forEach((receptor, indice) => {
    const nombre = String(receptor?.nombre ?? "").trim();
    if (!esNumeroPositivo(receptor?.potencia)) {
      errores.push(
        `La potencia del receptor ${indice + 1}${nombre ? ` (${nombre})` : ""} debe ser un número mayor que 0.`,
      );
      return;
    }
    servicios.push({
      nombre: nombre || `Receptor ${indice + 1}`,
      potencia: Number(receptor.potencia),
    });
  });

  const nViviendas = nBasicas + nElevadas;
  if (
    esEnteroNoNegativo(viviendasBasicas) &&
    esEnteroNoNegativo(viviendasElevadas) &&
    nViviendas < 1
  ) {
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

  const garajesCalculados = [];
  listaGarajes.forEach((garaje, indice) => {
    const ventilacion = garaje?.ventilacion;
    const densidad = densidadGaraje(ventilacion);
    if (densidad == null) {
      errores.push(`Indica si la ventilación del garaje ${indice + 1} es natural o forzada.`);
    }
    if (!esNumeroPositivo(garaje?.superficie)) {
      errores.push(`La superficie del garaje ${indice + 1} debe ser un número mayor que 0.`);
      return;
    }
    if (densidad == null) {
      return;
    }
    const metros = Number(garaje.superficie);
    const potencia = Math.max(metros * densidad, datos.minimoGaraje);
    garajesCalculados.push({
      ventilacion,
      densidad,
      superficie: metros,
      potencia,
      aplicaMinimo: potencia === datos.minimoGaraje,
    });
  });

  if (!esEnteroNoNegativo(estacionesRecarga)) {
    errores.push("El número de estaciones de recarga debe ser un entero mayor o igual que 0.");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const potenciaMedia = (nBasicas * datos.potenciaBasica + nElevadas * datos.potenciaElevada) / nViviendas;
  const coeficiente = coeficienteSimultaneidad(nViviendas, tarifaNocturna === true || tarifaNocturna === "si");
  const potenciaViviendas = coeficiente * potenciaMedia;
  const receptoresServicio = aplicarFactorMayor(servicios, datos.factorReceptorMayor);
  const potenciaServicios = receptoresServicio.reduce((total, receptor) => total + receptor.potenciaComputada, 0);
  const potenciaLocales = locales.reduce((total, local) => total + local.potencia, 0);
  const potenciaGaraje = garajesCalculados.reduce((total, garaje) => total + garaje.potencia, 0);
  const circuitosRecarga = circuitosParaEstaciones(nEstaciones);
  const potenciaRecarga = circuitosRecarga.reduce((total, circuito) => total + circuito.potencia, 0);
  const potenciaTotal = potenciaViviendas + potenciaServicios + potenciaLocales + potenciaGaraje + potenciaRecarga;

  return {
    ok: true,
    nBasicas,
    nElevadas,
    nViviendas,
    potenciaMedia: redondear(potenciaMedia, 2),
    coeficiente: redondear(coeficiente, 2),
    potenciaViviendas: redondear(potenciaViviendas, 2),
    factorReceptorMayor: datos.factorReceptorMayor,
    receptores: receptoresServicio.map((receptor) => ({
      ...receptor,
      potencia: redondear(receptor.potencia, 2),
      potenciaComputada: redondear(receptor.potenciaComputada, 2),
    })),
    potenciaServicios: redondear(potenciaServicios, 2),
    locales: locales.map((local) => ({
      ...local,
      superficie: redondear(local.superficie, 2),
      potencia: redondear(local.potencia, 2),
    })),
    potenciaLocales: redondear(potenciaLocales, 2),
    garajes: garajesCalculados.map((garaje) => ({
      ...garaje,
      superficie: redondear(garaje.superficie, 2),
      potencia: redondear(garaje.potencia, 2),
    })),
    potenciaGaraje: redondear(potenciaGaraje, 2),
    nEstacionesRecarga: nEstaciones,
    circuitosRecarga,
    potenciaRecarga: redondear(potenciaRecarga, 2),
    potenciaTotal: redondear(potenciaTotal, 2),
    potenciaTotalKw: redondear(potenciaTotal / 1000, 3),
    tarifaNocturna: tarifaNocturna === true || tarifaNocturna === "si",
    formula: "P = Cs · Pmedia + Psg + Plc + Pg + Pve",
    referencia: datos.referencia,
    referenciaRecarga: recarga.referencia,
  };
}

function circuitosParaEstaciones(nEstaciones) {
  const escalones = [...recarga.circuitos].sort((a, b) => a.estacionesMaximas - b.estacionesMaximas);
  const maximo = escalones.at(-1);
  const circuitos = [];
  let restantes = nEstaciones;

  while (restantes > 0) {
    const escalon = escalones.find((item) => item.estacionesMaximas >= restantes) ?? maximo;
    const estaciones = Math.min(restantes, escalon.estacionesMaximas);
    circuitos.push({
      corriente: escalon.corriente,
      potencia: escalon.potencia,
      estaciones,
      estacionesMaximas: escalon.estacionesMaximas,
    });
    restantes -= estaciones;
  }

  return circuitos;
}

function densidadGaraje(ventilacion) {
  if (ventilacion === "natural") {
    return datos.densidadGarajeNatural;
  }
  if (ventilacion === "forzada") {
    return datos.densidadGarajeForzada;
  }
  return null;
}

function aplicarFactorMayor(receptores, factor) {
  let indiceMayor = -1;
  receptores.forEach((receptor, indice) => {
    if (indiceMayor < 0 || receptor.potencia > receptores[indiceMayor].potencia) {
      indiceMayor = indice;
    }
  });

  return receptores.map((receptor, indice) => {
    const mayor = indice === indiceMayor;
    return {
      ...receptor,
      mayor,
      potenciaComputada: mayor ? receptor.potencia * factor : receptor.potencia,
    };
  });
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
