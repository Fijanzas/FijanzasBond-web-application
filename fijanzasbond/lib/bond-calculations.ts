// Reemplaza el contenido de: lib/bond-calculations.ts

import type { Bond, CashFlowEntry, BondMetrics, BondProjection } from "./types";
import type { ApiResults, ApiFlow } from "./apiClient";

// --- Helper Functions ---
function getPeriodsPerYear(frequency: Bond["paymentFrequency"]): number {
    switch (frequency) {
        case "monthly": return 12;
        case "quarterly": return 4;
        case "semiannual": return 2;
        case "annual": return 1;
        default: return 1;
    }
}

// --- Clase Principal de Cálculos ---
export class BondCalculator {

    /**
     * Calcula las métricas financieras clave a partir de los datos base del backend.
     */
    static calculateMetrics(
        bond: Bond,
        cashFlow: ApiFlow[],
        backendResults: ApiResults
    ): BondMetrics {

        const periodsPerYear = getPeriodsPerYear(bond.paymentFrequency);
        // Usamos la tasa de mercado para los cálculos de riesgo
        const periodicMarketRate = ((1 + (bond.marketRate)) ** (1 / periodsPerYear)) - 1;

        // --- Precio Teórico del Bono (usamos el del backend por consistencia) ---
        const theoreticalPrice = backendResults.Precio_Maximo;

        // --- Duración (Macaulay), Duración Modificada y Convexidad ---
        let durationNumerator = 0;
        let convexityNumerator = 0;

        cashFlow.forEach(entry => {
            const t = entry.period;
            // El valor presente de cada flujo se descuenta con la tasa de mercado
            const pvFlow = entry.net_flow / Math.pow(1 + periodicMarketRate, t);
            durationNumerator += t * pvFlow;
            convexityNumerator += t * (t + 1) * pvFlow;
        });

        const macaulayDurationPeriods = theoreticalPrice > 0 ? (durationNumerator / theoreticalPrice) : 0;
        const duration = macaulayDurationPeriods / periodsPerYear;

        const modifiedDuration = duration / (1 + periodicMarketRate);

        const convexity = theoreticalPrice > 0 ?
            (convexityNumerator / (theoreticalPrice * Math.pow(1 + periodicMarketRate, 2))) : 0;

        // Devolvemos una combinación de los resultados del backend y los calculados aquí
        return {
            duration,
            modifiedDuration,
            convexity,
            tcea: backendResults.TCEA,
            trea: backendResults.TREA,
            yieldToMaturity: bond.marke_Rate, // Usamos la tasa de mercado como YTM aproximado
            theoreticalPrice,
        };
    }
}