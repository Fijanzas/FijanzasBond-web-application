"use client"

import type { Bond } from "./types"

const STORAGE_KEY = "bond-app-bonds"

export class BondStorage {
  static getBonds(): Bond[] {
    if (typeof window === "undefined") return []

    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return this.getDefaultBonds()

    try {
      return JSON.parse(stored)
    } catch {
      return this.getDefaultBonds()
    }
  }

  static saveBond(bond: Bond): void {
    const bonds = this.getBonds()
    const existingIndex = bonds.findIndex((b) => b.id === bond.id)

    if (existingIndex >= 0) {
      bonds[existingIndex] = { ...bond, updatedAt: new Date().toISOString() }
    } else {
      bonds.push({ ...bond, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(bonds))
  }

  static deleteBond(id: string): void {
    const bonds = this.getBonds().filter((b) => b.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bonds))
  }

  static getBond(id: string): Bond | undefined {
    return this.getBonds().find((b) => b.id === id)
  }

  private static getDefaultBonds(): Bond[] {
    return [
      {
        id: "1",
        name: "Bond A",
        issuer: "Company X",
        nominalValue: 100000,
        interestRate: 5.0,
        totalTerm: 5,
        paymentFrequency: "semiannual",
        issueDate: "2023-01-15",
        maturityDate: "2028-01-15",
        currency: "USD",
        rateType: "effective",
        graceType: "none",
        includeIssuanceCosts: false,
        status: "active",
        createdAt: "2023-01-15T00:00:00Z",
        updatedAt: "2023-01-15T00:00:00Z",
      },
      {
        id: "2",
        name: "Bond B",
        issuer: "Company Y",
        nominalValue: 200000,
        interestRate: 4.0,
        totalTerm: 3,
        paymentFrequency: "quarterly",
        issueDate: "2022-06-30",
        maturityDate: "2025-06-30",
        currency: "USD",
        rateType: "effective",
        graceType: "partial",
        graceMonths: 6,
        includeIssuanceCosts: false,
        status: "active",
        createdAt: "2022-06-30T00:00:00Z",
        updatedAt: "2022-06-30T00:00:00Z",
      },
    ]
  }
}
