import cables from "../../data/cables.json" with { type: "json" };
import protecciones from "../../data/protecciones.json" with { type: "json" };
import { redondear } from "../utils/math.js";
import { esNumeroPositivo } from "../utils/validation.js";

export function calcularProtecciones({
  intensidad,
  tipo,
  seccion,
  material,
  carga,
  corrienteCortocircuito,
  incluirDiferencial,
  proteccionDiferencial,
}) {
  const errores = [];

  if (!esNumeroPositivo(intensidad)) {
    errores.push("La intensidad de diseño (Ib) debe ser un número mayor que 0.");
  }

  if (tipo !== "monofasica" && tipo !== "trifasica") {
    errores.push("Indica si el suministro es monofásico o trifásico.");
  }

  if (!esNumeroPositivo(seccion)) {
    errores.push("La sección debe ser un número mayor que 0.");
  }

  if (material !== "cobre" && material !== "aluminio") {
    errores.push("Indica si el conductor es de cobre o de aluminio.");
  }

  if (!protecciones.curvas[carga]) {
    errores.push("Indica el tipo de carga para elegir la curva del magnetotérmico.");
  }

  if (!esNumeroPositivo(corrienteCortocircuito)) {
    errores.push("La corriente de cortocircuito prevista (Icc) debe ser un número mayor que 0.");
  }

  if (incluirDiferencial !== "si" && incluirDiferencial !== "no") {
    errores.push("Indica si quieres incluir interruptor diferencial.");
  }

  if (incluirDiferencial === "si" && !protecciones.diferencial.sensibilidades[proteccionDiferencial]) {
    errores.push("Indica si el diferencial protege a personas (30 mA) o contra incendio (300 mA).");
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const Ib = Number(intensidad);
  const Icc = Number(corrienteCortocircuito);
  const conductoresCargados = tipo === "trifasica" ? 3 : 2;
  const tablaImax = cables.intensidadMaxima[material]?.[String(conductoresCargados)];
  const Iz = tablaImax?.[String(Number(seccion))];

  if (Iz == null) {
    return {
      ok: false,
      errores: ["No hay intensidad admisible para esa sección y material en la tabla."],
    };
  }

  if (Ib > Iz) {
    return {
      ok: false,
      errores: [
        `El cable no admite la intensidad de diseño (Ib = ${formatearAmperios(Ib)} A > Iz = ${formatearAmperios(Iz)} A). Aumenta la sección.`,
      ],
    };
  }

  const In = protecciones.intensidadesNominales.find((calibre) => calibre >= Ib && calibre <= Iz);

  if (In == null) {
    return {
      ok: false,
      errores: [
        `No hay un calibre comercial que cumpla Ib ≤ In ≤ Iz (${formatearAmperios(Ib)} A ≤ In ≤ ${formatearAmperios(Iz)} A).`,
      ],
    };
  }

  const Icn = protecciones.poderCorte.find((valor) => valor + 1e-9 >= Icc);

  if (Icn == null) {
    return {
      ok: false,
      errores: [
        `La Icc prevista (${formatearAmperios(Icc)} kA) supera el poder de corte máximo de la tabla (36 kA).`,
      ],
    };
  }

  const datosCurva = protecciones.curvas[carga];
  const polosMagnetotermico = polosSegunCircuito(tipo, carga);
  const I2 = 1.45 * In;
  const limiteI2 = 1.45 * Iz;

  const resultado = {
    ok: true,
    tipo,
    formula: "Ib ≤ In ≤ Iz",
    Ib: redondear(Ib, 2),
    In,
    Iz,
    I2: redondear(I2, 2),
    limiteI2: redondear(limiteI2, 2),
    curva: datosCurva.curva,
    etiquetaCarga: datosCurva.etiqueta,
    polosMagnetotermico,
    Icn,
    Icc: redondear(Icc, 2),
    referencia: protecciones.referencia,
    diferencial: null,
  };

  if (incluirDiferencial === "si") {
    const sensibilidad = protecciones.diferencial.sensibilidades[proteccionDiferencial];
    const InDiferencial =
      protecciones.diferencial.intensidades.find((calibre) => calibre >= In) ?? In;

    resultado.diferencial = {
      sensibilidad,
      tipo: protecciones.diferencial.tipo,
      In: InDiferencial,
      polos: tipo === "trifasica" ? "4P" : "2P",
      proteccion: proteccionDiferencial,
    };
  }

  return resultado;
}

function polosSegunCircuito(tipo, carga) {
  if (tipo === "monofasica") {
    return "2P";
  }

  return carga === "motores" ? "3P" : "4P";
}

function formatearAmperios(valor) {
  return Number.isInteger(valor) ? String(valor) : String(valor);
}
