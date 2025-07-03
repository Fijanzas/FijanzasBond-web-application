export interface User {
  id: string
  username: string
  email?: string
}

export interface Bond {
  id: string
  name: string
  // issuer: string // Si quieres, puedes añadir un campo de nombre en el formulario
  nominalValue: number
  interestRate: number
  totalTerm: number
  paymentFrequency: "monthly" | "quarterly" | "semiannual" | "annual"
  issueDate: string
  maturityDate: string
  currency: "USD" | "PEN" | "EUR"
  rateType: "effective" | "nominal"
  status: "active" | "matured" | "defaulted"
  createdAt: string
  updatedAt: string
}

export interface CashFlowEntry {
  date: string
  period: number
  amortization: number
  interest: number
  payment: number
  balance: number
}

export interface BondMetrics {
  duration: number
  modifiedDuration: number
  convexity: number
  tcea: number // Tasa de Costo Efectivo Anual
  trea: number // Tasa de Rendimiento Efectivo Anual
  yieldToMaturity: number
  theoreticalPrice: number
}

export interface BondProjection {
  bond: Bond
  cashFlow: CashFlowEntry[]
  metrics: BondMetrics
  totalInterest: number
  totalAmortization: number
}

export interface ProjectionConfig {
  currency: "USD" | "PEN" | "EUR"
  rateType: "effective" | "nominal"
  capitalizationFrequency: "daily" | "monthly" | "quarterly" | "semiannual" | "annual"
  applyGrace: boolean
  graceType: "partial" | "total"
  graceMonths: number
}
