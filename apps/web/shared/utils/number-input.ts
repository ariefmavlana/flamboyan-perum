const formatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 20 })

export function displayNumberInput(value: string | number | null | undefined) {
  if (value === '' || value === null || value === undefined) return ''
  const number = Number(value)
  return Number.isFinite(number) ? formatter.format(number) : ''
}

export function parseNumberInput(text: string, rebalanceGroups = false) {
  let cleaned = text
    .trim()
    .replace(/^Rp\s*/i, '')
    .replace(/\s/g, '')
  if (rebalanceGroups) cleaned = cleaned.replace(/\./g, '')
  if (!cleaned) return { text: '', raw: '', error: '' }
  if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d*)?$/.test(cleaned))
    return {
      text,
      raw: '',
      error:
        'Gunakan angka, titik ribuan, dan koma desimal, misalnya 1.000 atau 8,5.',
    }
  const raw = cleaned.replace(/\./g, '').replace(',', '.')
  const number = Number(raw)
  if (!Number.isFinite(number) || Math.abs(number) > Number.MAX_SAFE_INTEGER)
    return { text, raw: '', error: 'Angka terlalu besar.' }
  const [integer = '', fraction] = raw.split('.')
  const normalizedInteger = integer.replace(/^(-?)0+(?=\d)/, '$1')
  const grouped = normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return {
    text: grouped + (fraction === undefined ? '' : ',' + fraction),
    raw:
      normalizedInteger +
      (fraction && /[1-9]/.test(fraction) ? '.' + fraction : ''),
    error: '',
  }
}

export function numberInputError(
  raw: string,
  min?: number | string,
  max?: number | string,
  step: number | string = 1,
) {
  if (raw === '') return ''
  const value = Number(raw)
  if (min !== undefined && value < Number(min))
    return `Nilai minimum ${displayNumberInput(min)}.`
  if (max !== undefined && value > Number(max))
    return `Nilai maksimum ${displayNumberInput(max)}.`
  if (step !== 'any' && Number(step) > 0) {
    const stepText = String(step)
    const precision = stepText.includes('e-')
      ? Number(stepText.split('e-')[1])
      : (stepText.split('.')[1]?.length ?? 0)
    if ((raw.split('.')[1]?.replace(/0+$/, '').length ?? 0) > precision)
      return precision
        ? `Gunakan maksimal ${precision} angka di belakang koma.`
        : 'Gunakan bilangan bulat tanpa desimal.'
    const units = (value - Number(min ?? 0)) / Number(step)
    if (Math.abs(units - Math.round(units)) > 0.000001)
      return `Gunakan kelipatan ${displayNumberInput(step)}${Number(step) < 1 ? ' dengan koma sebagai desimal' : ''}.`
  }
  return ''
}
