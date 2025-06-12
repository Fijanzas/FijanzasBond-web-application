import type { Bond, CashFlowEntry, BondMetrics, BondProjection } from "./types"

export class BondCalculator {
  static calculateGermanAmortization(bond: Bond): CashFlowEntry[] {
    const { nominalValue, interestRate, totalTerm, paymentFrequency, graceType = "none", graceMonths = 0 } = bond

    const periodsPerYear = this.getPeriodsPerYear(paymentFrequency)
    const totalPeriods = totalTerm * periodsPerYear
    const periodRate = interestRate / 100 / periodsPerYear

    const cashFlow: CashFlowEntry[] = []
    let balance = nominalValue

    // Calculate amortization per period (constant for German method)
    const amortizationPerPeriod = nominalValue / totalPeriods

    for (let period = 1; period <= totalPeriods; period++) {
      const date = this.calculatePaymentDate(bond.issueDate, period, paymentFrequency)
      const interest = balance * periodRate

      let amortization = 0
      let payment = 0

      // Apply grace period logic
      if (period <= graceMonths) {
        if (graceType === "partial") {
          // Only pay interest during grace period
          payment = interest
          amortization = 0
        } else if (graceType === "total") {
          // No payments during grace period
          payment = 0
          amortization = 0
          balance += interest // Capitalize interest
        }
      } else {
        // Normal payment after grace period
        amortization = amortizationPerPeriod
        payment = amortization + interest
        balance -= amortization
      }

      cashFlow.push({
        date,
        period,
        amortization,
        interest,
        payment,
        balance: Math.max(0, balance),
      })
    }

    return cashFlow
  }

  static calculateMetrics(bond: Bond, cashFlow: CashFlowEntry[]): BondMetrics {
    const periodRate = bond.interestRate / 100 / this.getPeriodsPerYear(bond.paymentFrequency)

    // Calculate Duration (Macaulay)
    let duration = 0
    let presentValueSum = 0

    cashFlow.forEach((entry, index) => {
      const period = index + 1
      const presentValue = entry.payment / Math.pow(1 + periodRate, period)
      duration += period * presentValue
      presentValueSum += presentValue
    })

    duration = duration / presentValueSum / this.getPeriodsPerYear(bond.paymentFrequency)

    // Modified Duration
    const modifiedDuration = duration / (1 + periodRate)

    // Convexity (simplified calculation)
    let convexity = 0
    cashFlow.forEach((entry, index) => {
      const period = index + 1
      const presentValue = entry.payment / Math.pow(1 + periodRate, period)
      convexity += period * (period + 1) * presentValue
    })
    convexity =
      convexity /
      (Math.pow(1 + periodRate, 2) * presentValueSum) /
      Math.pow(this.getPeriodsPerYear(bond.paymentFrequency), 2)

    // TCEA and TREA calculations
    const totalInterest = cashFlow.reduce((sum, entry) => sum + entry.interest, 0)
    const tcea = ((totalInterest / bond.nominalValue) * 100) / bond.totalTerm
    const trea = bond.interestRate // Simplified for demo

    // Yield to Maturity (approximation)
    const yieldToMaturity = bond.interestRate

    // Theoretical Price
    const theoreticalPrice = cashFlow.reduce((sum, entry, index) => {
      return sum + entry.payment / Math.pow(1 + periodRate, index + 1)
    }, 0)

    return {
      duration,
      modifiedDuration,
      convexity,
      tcea,
      trea,
      yieldToMaturity,
      theoreticalPrice,
    }
  }

  static projectBond(bond: Bond): BondProjection {
    const cashFlow = this.calculateGermanAmortization(bond)
    const metrics = this.calculateMetrics(bond, cashFlow)

    const totalInterest = cashFlow.reduce((sum, entry) => sum + entry.interest, 0)
    const totalAmortization = cashFlow.reduce((sum, entry) => sum + entry.amortization, 0)

    return {
      bond,
      cashFlow,
      metrics,
      totalInterest,
      totalAmortization,
    }
  }

  private static getPeriodsPerYear(frequency: string): number {
    switch (frequency) {
      case "monthly":
        return 12
      case "quarterly":
        return 4
      case "semiannual":
        return 2
      case "annual":
        return 1
      default:
        return 12
    }
  }

  private static calculatePaymentDate(issueDate: string, period: number, frequency: string): string {
    const date = new Date(issueDate)
    const monthsToAdd = period * (12 / this.getPeriodsPerYear(frequency))
    date.setMonth(date.getMonth() + monthsToAdd)
    return date.toISOString().split("T")[0]
  }
}
