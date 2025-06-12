"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BondStorage } from "@/lib/bond-storage"
import type { Bond } from "@/lib/types"
import { AlertCircle } from "lucide-react"

interface BondFormProps {
  bondId?: string
  onSave?: (bond: Bond) => void
}

export function BondForm({ bondId, onSave }: BondFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    issuer: "",
    valorComercial: "",
    costoCavali: "",
    teaCupon: "",
    teaMercado: "",
    primaRedencion: "",
    flotacion: "",
    paymentFrequency: "semiannual",
    currency: "USD",
    rateType: "effective",
    capitalizationFrequency: "annual",
    graceType: "none",
    graceMonths: "",
    includeIssuanceCosts: false,
    issuanceCosts: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (bondId) {
      const bond = BondStorage.getBond(bondId)
      if (bond) {
        setFormData({
          name: bond.name,
          issuer: bond.issuer,
          valorComercial: bond.valorComercial?.toString() || "",
          costoCavali: bond.costoCavali?.toString() || "",
          teaCupon: bond.teaCupon?.toString() || "",
          teaMercado: bond.teaMercado?.toString() || "",
          primaRedencion: bond.primaRedencion?.toString() || "",
          flotacion: bond.flotacion?.toString() || "",
          paymentFrequency: bond.paymentFrequency,
          currency: bond.currency,
          rateType: bond.rateType,
          capitalizationFrequency: bond.capitalizationFrequency || "annual",
          graceType: bond.graceType || "none",
          graceMonths: bond.graceMonths?.toString() || "",
          includeIssuanceCosts: bond.includeIssuanceCosts,
          issuanceCosts: bond.issuanceCosts?.toString() || "",
        })
      }
    }
  }, [bondId])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Bond name is required"
    if (!formData.issuer.trim()) newErrors.issuer = "Issuer is required"
    if (!formData.valorComercial || Number.parseFloat(formData.valorComercial) <= 0) {
      newErrors.valorComercial = "Commercial value must be greater than 0"
    }
    if (!formData.costoCavali || Number.parseFloat(formData.costoCavali) < 0) {
      newErrors.costoCavali = "Cavali cost cannot be negative"
    }
    if (!formData.teaCupon || Number.parseFloat(formData.teaCupon) < 0) {
      newErrors.teaCupon = "TEA Coupon cannot be negative"
    }
    if (!formData.teaMercado || Number.parseFloat(formData.teaMercado) < 0) {
      newErrors.teaMercado = "TEA Market cannot be negative"
    }
    if (!formData.primaRedencion || Number.parseFloat(formData.primaRedencion) < 0) {
      newErrors.primaRedencion = "Redemption premium cannot be negative"
    }
    if (!formData.flotacion || Number.parseFloat(formData.flotacion) < 0) {
      newErrors.flotacion = "Flotation percentage cannot be negative"
    }
    if (formData.graceType !== "none" && (!formData.graceMonths || Number.parseInt(formData.graceMonths) <= 0)) {
      newErrors.graceMonths = "Grace months must be specified when grace period is applied"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const issueDate = new Date().toISOString().split("T")[0]
      const maturityDate = new Date()
      maturityDate.setFullYear(maturityDate.getFullYear() + Number.parseInt(formData.totalTerm))

      const bond: Bond = {
        id: bondId || Date.now().toString(),
        name: formData.name,
        issuer: formData.issuer,
        nominalValue: Number.parseFloat(formData.nominalValue),
        interestRate: Number.parseFloat(formData.interestRate),
        totalTerm: Number.parseInt(formData.totalTerm),
        paymentFrequency: formData.paymentFrequency as Bond["paymentFrequency"],
        issueDate,
        maturityDate: maturityDate.toISOString().split("T")[0],
        currency: formData.currency as Bond["currency"],
        rateType: formData.rateType as Bond["rateType"],
        capitalizationFrequency: formData.capitalizationFrequency as Bond["capitalizationFrequency"],
        graceType: formData.graceType as Bond["graceType"],
        graceMonths: formData.graceType !== "none" ? Number.parseInt(formData.graceMonths) : undefined,
        includeIssuanceCosts: formData.includeIssuanceCosts,
        issuanceCosts: formData.includeIssuanceCosts ? Number.parseFloat(formData.issuanceCosts) : undefined,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      BondStorage.saveBond(bond)

      if (onSave) {
        onSave(bond)
      } else {
        router.push(`/bonds/${bond.id}/results`)
      }
    } catch (error) {
      setErrors({ general: "Failed to save bond. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">{bondId ? "Edit Bond" : "Register New Bond"}</CardTitle>
        <CardDescription className="text-gray-400">
          Enter the bond details to calculate cash flow projections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <Alert className="bg-red-900/50 border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-200">{errors.general}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Bond Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
                placeholder="Enter bond name"
              />
              {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuer" className="text-white">
                Issuer
              </Label>
              <Input
                id="issuer"
                value={formData.issuer}
                onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
                placeholder="Enter issuer name"
              />
              {errors.issuer && <p className="text-red-400 text-sm">{errors.issuer}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorComercial" className="text-white">
                Valor Comercial
              </Label>
              <Input
                id="valorComercial"
                type="number"
                step="0.01"
                value={formData.valorComercial}
                onChange={(e) => setFormData({ ...formData, valorComercial: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
                placeholder="Enter commercial value"
              />
              {errors.valorComercial && <p className="text-red-400 text-sm">{errors.valorComercial}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="costoCavali" className="text-white">
                Costo Cavali (%)
              </Label>
              <Input
                id="costoCavali"
                type="number"
                step="0.01"
                value={formData.costoCavali}
                onChange={(e) => setFormData({ ...formData, costoCavali: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
                placeholder="Enter Cavali cost percentage"
              />
              {errors.costoCavali && <p className="text-red-400 text-sm">{errors.costoCavali}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teaCupon" className="text-white">
                TEA Cupón (%)
              </Label>
              <Input
                id="teaCupon"
                type="number"
                step="0.01"
                value={formData.teaCupon}
                onChange={(e) => setFormData({ ...formData, teaCupon: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
                placeholder="Enter coupon TEA"
              />
              {errors.teaCupon && <p className="text-red-400 text-sm">{errors.teaCupon}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teaMercado" className="text-white">
                TEA Mercado (%)
              </Label>
              <Input
                id="teaMercado"
                type="number"
                step="0.01"
                value={formData.teaMercado}
                onChange={(e) => setFormData({ ...formData, teaMercado: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
                placeholder="Enter market TEA"
              />
              {errors.teaMercado && <p className="text-red-400 text-sm">{errors.teaMercado}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaRedencion" className="text-white">
                Prima de Redención
              </Label>
              <Input
                id="primaRedencion"
                type="number"
                step="0.01"
                value={formData.primaRedencion}
                onChange={(e) => setFormData({ ...formData, primaRedencion: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
                placeholder="Enter redemption premium"
              />
              {errors.primaRedencion && <p className="text-red-400 text-sm">{errors.primaRedencion}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="flotacion" className="text-white">
                Flotación (%)
              </Label>
              <Input
                id="flotacion"
                type="number"
                step="0.01"
                value={formData.flotacion}
                onChange={(e) => setFormData({ ...formData, flotacion: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white"
                placeholder="Enter flotation percentage"
              />
              {errors.flotacion && <p className="text-red-400 text-sm">{errors.flotacion}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Payment Frequency</Label>
              <Select
                value={formData.paymentFrequency}
                onValueChange={(value) => setFormData({ ...formData, paymentFrequency: value })}
              >
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semiannual">Semi-annual</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="PEN">PEN</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Rate Type</Label>
              <Select
                value={formData.rateType}
                onValueChange={(value) => setFormData({ ...formData, rateType: value })}
              >
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="effective">Effective Annual Rate</SelectItem>
                  <SelectItem value="nominal">Nominal Rate with Capitalization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.rateType === "nominal" && (
              <div className="space-y-2">
                <Label className="text-white">Capitalization Frequency</Label>
                <Select
                  value={formData.capitalizationFrequency}
                  onValueChange={(value) => setFormData({ ...formData, capitalizationFrequency: value })}
                >
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semiannual">Semi-annual</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Grace Period</Label>
              <Select
                value={formData.graceType}
                onValueChange={(value) => setFormData({ ...formData, graceType: value })}
              >
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grace Period</SelectItem>
                  <SelectItem value="partial">Partial Grace (Interest Only)</SelectItem>
                  <SelectItem value="total">Total Grace (No Payments)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.graceType !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="graceMonths" className="text-white">
                  Number of Grace Months
                </Label>
                <Input
                  id="graceMonths"
                  type="number"
                  min="1"
                  max="24"
                  value={formData.graceMonths}
                  onChange={(e) => setFormData({ ...formData, graceMonths: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-white"
                  placeholder="Enter number of months"
                />
                {errors.graceMonths && <p className="text-red-400 text-sm">{errors.graceMonths}</p>}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeIssuanceCosts"
                checked={formData.includeIssuanceCosts}
                onCheckedChange={(checked) => setFormData({ ...formData, includeIssuanceCosts: checked as boolean })}
              />
              <Label htmlFor="includeIssuanceCosts" className="text-white">
                Include Issuance Costs (affects TCEA)
              </Label>
            </div>

            {formData.includeIssuanceCosts && (
              <div className="space-y-2">
                <Label htmlFor="issuanceCosts" className="text-white">
                  Issuance Costs
                </Label>
                <Input
                  id="issuanceCosts"
                  type="number"
                  step="0.01"
                  value={formData.issuanceCosts}
                  onChange={(e) => setFormData({ ...formData, issuanceCosts: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-white"
                  placeholder="Enter issuance costs"
                />
              </div>
            )}
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isLoading}>
            {isLoading ? "Calculating..." : "Calculate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
