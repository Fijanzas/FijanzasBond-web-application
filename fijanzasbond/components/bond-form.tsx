// Reemplaza el contenido completo de: components/bond-form.tsx

"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { apiClient, type ApiBondPayload } from "@/lib/apiClient"
import { useAuth } from "@/lib/auth"

interface BondFormProps {
  bondId?: string
}

// --- CAMBIO: El estado inicial ahora es más simple ---
const initialFormData = {
  nominal_value: "",
  coupon_rate: "",
  market_rate: "",
  duration: "",
  bonus: "",
  total_grace_period: "",
  partial_grace_period: "",
};

export function BondForm({ bondId }: BondFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoadingData, setIsLoadingData] = useState(!!bondId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bondId) {
      const fetchBondData = async () => {
        setIsLoadingData(true);
        try {
          const bondData = await apiClient.getBondById(parseInt(bondId, 10));
          // --- CAMBIO: Rellenamos solo los campos que existen ---
          setFormData({
            nominal_value: String(bondData.nominal_value),
            coupon_rate: String(bondData.coupon_rate * 100),
            market_rate: String(bondData.market_rate * 100),
            duration: String(bondData.duration),
            bonus: String(bondData.bonus * 100),
            total_grace_period: String(bondData.total_grace_period),
            partial_grace_period: String(bondData.partial_grace_period),
          });
        } catch (error) {
          setErrors({ general: "Failed to load bond data for editing." });
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchBondData();
    } else {
      // --- CAMBIO: Valores por defecto para el formulario simplificado ---
      setFormData({
        nominal_value: "1000",
        coupon_rate: "5",
        market_rate: "6",
        duration: "5",
        bonus: "0",
        total_grace_period: "0",
        partial_grace_period: "0",
      });
    }
  }, [bondId]);

  // En components/bond-form.tsx

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    // Desestructuramos para separar los campos con validaciones especiales
    const {
      nominal_value,
      duration,
      bonus, // Sacamos 'bonus' para darle un tratamiento especial
      total_grace_period,
      partial_grace_period,
      ...rest
    } = formData;

    // --- Validación para Valor Nominal (sin cambios) ---
    const nv = parseFloat(nominal_value);
    if (nominal_value.trim() === '') newErrors.nominal_value = "Required";
    else if (isNaN(nv)) newErrors.nominal_value = "Must be a number";
    else if (nv < 1000 || nv > 10000) newErrors.nominal_value = "Must be between 1000 and 10000";
    else if (nv % 1000 !== 0) newErrors.nominal_value = "Must be a multiple of 1000";

    // --- Validación para Años (Duration) (sin cambios) ---
    const d = parseInt(duration, 10);
    if (duration.trim() === '') newErrors.duration = "Required";
    else if (isNaN(d)) newErrors.duration = "Must be a number";
    else if (d < 3 || d > 20) newErrors.duration = "Must be between 3 and 20 years";

    // --- CAMBIO: Validación específica para Bonus ---
    const bonusValue = parseFloat(bonus);
    if (bonus.trim() === '') {
      newErrors.bonus = "Required";
    } else if (isNaN(bonusValue)) {
      newErrors.bonus = "Must be a valid number";
    }

    // --- Validación general para el resto de los campos ---
    for (const [key, value] of Object.entries(rest)) {
      if (value.trim() === '') newErrors[key] = "Required";
      else if (isNaN(parseFloat(value))) newErrors[key] = "Must be a number";
      else if (parseFloat(value) < 0) newErrors[key] = "Cannot be negative";
    }

    // --- Validación opcional para los períodos de gracia (sin cambios) ---
    const tgp = parseInt(total_grace_period, 10);
    const pgp = parseInt(partial_grace_period, 10);
    if (total_grace_period.trim() !== '' && (isNaN(tgp) || tgp < 0)) newErrors.total_grace_period = "Must be a positive number or 0";
    if (partial_grace_period.trim() !== '' && (isNaN(pgp) || pgp < 0)) newErrors.partial_grace_period = "Must be a positive number or 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // --- CAMBIO: El payload se construye con menos campos del formulario
      // y asume valores por defecto para los eliminados.
      const nominalValue = parseFloat(formData.nominal_value);
      const payload: ApiBondPayload = {
        user_id: parseInt(user.id, 10),
        nominal_value: nominalValue,
        commercial_value: nominalValue, // Asumimos que el valor comercial es igual al nominal
        coupon_rate: parseFloat(formData.coupon_rate) / 100,
        market_rate: parseFloat(formData.market_rate) / 100,
        payment_frequency: 2,
        duration: parseInt(formData.duration, 10),
        bonus: parseFloat(formData.bonus) / 100,
        flotation: 0, // Valor por defecto
        cavali: 0, // Valor por defecto
        structuration: 0, // Valor por defecto
        colocation: 0, // Valor por defecto
        total_grace_period: formData.total_grace_period ? parseInt(formData.total_grace_period, 10) : 0,
        partial_grace_period: formData.partial_grace_period ? parseInt(formData.partial_grace_period, 10) : 0,
      };

      if (bondId) {
        await apiClient.updateBond(parseInt(bondId, 10), payload);
        router.push(`/bonds/${bondId}/results`);
      } else {
        const newBond = await apiClient.createBond(payload);
        router.push(`/bonds/${newBond.id}/results`);
      }
    } catch (error: any) {
      setErrors({ general: (error as Error).message || "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  }

  const renderInputField = (id: keyof typeof formData, label: string) => (
      <div key={id} className="space-y-2">
        <Label htmlFor={id} className="text-white capitalize">{label}</Label>
        <Input id={id} type="number" step="any" value={formData[id]} onChange={handleInputChange} className={`bg-gray-700/50 border-gray-600 text-white ${errors[id] ? 'border-red-500' : ''}`} placeholder={`Enter ${label.toLowerCase()}`} />
        {errors[id] && <p className="text-red-400 text-sm mt-1">{errors[id]}</p>}
      </div>
  );

  return (
      <Card className="max-w-2xl mx-auto bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">{bondId ? `Editing Bond #${bondId}` : "Register New Bond"}</CardTitle>
          <CardDescription className="text-gray-400">
            {bondId ? "Modify the parameters and save to recalculate." : "Enter bond details to calculate cash flow."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
              <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>
          ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && <Alert variant="destructive" className="bg-red-900/50 border-red-700 text-red-200"><AlertCircle className="h-4 w-4" /><AlertDescription>{errors.general}</AlertDescription></Alert>}

                {/* --- CAMBIO: Renderizado explícito de los campos restantes --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderInputField("nominal_value", "Nominal Value")}
                  {renderInputField("coupon_rate", "Coupon Rate (%)")}
                  {renderInputField("market_rate", "Market Rate (%)")}
                  {renderInputField("duration", "Years")}
                  {renderInputField("bonus", "Bonus (%)")}
                  {renderInputField("total_grace_period", "Total Grace Period (periods)")}
                  {renderInputField("partial_grace_period", "Partial Grace Period (periods)")}
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : (bondId ? "Save Changes" : "Create & Calculate")}
                </Button>
              </form>
          )}
        </CardContent>
      </Card>
  )
}