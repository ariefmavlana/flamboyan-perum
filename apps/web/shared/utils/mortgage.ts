/** Calculation kernel only. Bank offers / floating scenarios require a separate UI contract. */
export function simulateMortgage(
  price: number,
  downPayment: number,
  years: number,
  annualRate: number,
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
  const principal = price - downPayment
  const months = years * 12
  const rate = annualRate / 1200
  const monthlyPayment =
    principal === 0
      ? 0
      : rate === 0
        ? principal / months
        : (principal * rate) / -Math.expm1(-months * Math.log1p(rate))
  let balance = principal
  const schedule = Array.from({ length: months }, (_, index) => {
    const interest = balance * rate
    const principalPaid =
      index === months - 1
        ? balance
        : Math.min(balance, Math.max(0, monthlyPayment - interest))
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
