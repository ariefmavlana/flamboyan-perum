/** Annuity estimate, with one explicit fixed-to-floating scenario reset. */
export function simulateMortgage(
  price: number,
  downPayment: number,
  years: number,
  annualRate: number,
  floating?: { afterMonths: number; annualRate: number },
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
    if (floating && index === floating.afterMonths) {
      rate = floating.annualRate / 1200
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
