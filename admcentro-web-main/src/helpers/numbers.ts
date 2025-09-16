export const roundUp = (value: number) => Math.ceil(Number(value))

export const formatPrice = (price: number) => {
  if (!price) return 0
  return price.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}
