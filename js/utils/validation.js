export function esNumeroPositivo(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0;
}

export function esFactorPotencia(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 && numero <= 1;
}
