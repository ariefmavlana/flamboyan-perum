/** Monthly annuity; recalculate each rate phase from remaining principal and term. */
export function simulateMortgage(
  price: number,
  downPayment: number,
  years: number,
  annualRate: number,
  floating?: { afterMonths: number; annualRate: number },
  changes: { afterMonths: number; annualRate: number }[] = [],
) {
  if (
    ![price, downPayment, years, annualRate].every(Number.isFinite) ||
    !Number.isInteger(price) ||
    price < 1 ||
    price > 1e12 ||
    !Number.isInteger(downPayment) ||
    downPayment < 0 ||
    downPayment > price ||
    !Number.isInteger(years) ||
    years < 1 ||
    years > 30 ||
    annualRate < 0 ||
    annualRate > 30
  )
    throw new RangeError('Input simulasi tidak valid')
  if (
    floating &&
    (!Number.isInteger(floating.afterMonths) ||
      floating.afterMonths < 1 ||
      floating.afterMonths >= years * 12 ||
      !Number.isFinite(floating.annualRate) ||
      floating.annualRate < 0 ||
      floating.annualRate > 30)
  )
    throw new RangeError('Skenario floating tidak valid')
  const principal = price - downPayment
  const months = years * 12
  if (changes.length > 10 || (floating && changes.length))
    throw new RangeError('Tahapan bunga tidak valid')
  let previous = 0
  for (const change of changes) {
    if (
      !Number.isInteger(change.afterMonths) ||
      change.afterMonths <= previous ||
      change.afterMonths >= months ||
      !Number.isFinite(change.annualRate) ||
      change.annualRate < 0 ||
      change.annualRate > 30
    )
      throw new RangeError('Tahapan bunga tidak valid')
    previous = change.afterMonths
  }
  const resets = floating ? [floating] : changes
  let rate = annualRate / 1200
  const paymentFor = (
    balance: number,
    remaining: number,
    monthlyRate: number,
  ) =>
    balance === 0
      ? 0
      : monthlyRate === 0
        ? balance / remaining
        : (balance * monthlyRate) /
          -Math.expm1(-remaining * Math.log1p(monthlyRate))
  const monthlyPayment = paymentFor(principal, months, rate)
  let payment = monthlyPayment
  let balance = principal
  const schedule = Array.from({ length: months }, (_, index) => {
    const reset = resets.find((change) => change.afterMonths === index)
    if (reset) {
      rate = reset.annualRate / 1200
      payment = paymentFor(balance, months - index, rate)
    }
    const interest = balance * rate
    const principalPaid =
      index === months - 1
        ? balance
        : Math.min(balance, Math.max(0, payment - interest))
    balance = Math.max(0, balance - principalPaid)
    return {
      month: index + 1,
      payment: principalPaid + interest,
      principal: principalPaid,
      interest,
      balance,
    }
  })
  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0)
  return {
    monthlyPayment,
    principal,
    totalInterest,
    totalPayment: principal + totalInterest,
    schedule,
  }
}

export function estimateBankFees(
  principal: number,
  terms: {
    provision_percent?: number
    admin_percent?: number
    admin_min_idr?: number
    admin_max_idr?: number
    appraisal_min_idr?: number
    appraisal_max_idr?: number
  },
) {
  if (
    !Number.isFinite(principal) ||
    principal < 0 ||
    principal > 1e12 ||
    Object.values(terms).some(
      (value) => value !== undefined && (!Number.isFinite(value) || value < 0),
    )
  )
    throw new RangeError('Biaya tidak valid')
  const provision =
    terms.provision_percent === undefined
      ? null
      : (principal * terms.provision_percent) / 100
  const administration =
    terms.admin_percent === undefined ||
    terms.admin_min_idr === undefined ||
    terms.admin_max_idr === undefined
      ? null
      : Math.min(
          terms.admin_max_idr,
          Math.max(
            terms.admin_min_idr,
            (principal * terms.admin_percent) / 100,
          ),
        )
  return {
    provision,
    administration,
    appraisalMin: terms.appraisal_min_idr ?? null,
    appraisalMax: terms.appraisal_max_idr ?? null,
  }
}
