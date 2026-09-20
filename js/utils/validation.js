export function esNumeroPositivo(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0;
}

export function esFactorPotencia(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 && numero <= 1;
}

export function esEnteroNoNegativo(valor) {
  if (valor === "" || valor == null) {
    return true;
  }
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 0;
}

export function esEnteroPositivo(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 1;
}

export function esNumeroNoNegativo(valor) {
  if (valor === "" || valor == null) {
    return true;
  }
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0;
}
