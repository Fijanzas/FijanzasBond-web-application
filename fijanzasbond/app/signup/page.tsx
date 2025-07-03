// Crea este archivo: app/signup/page.tsx

"use client"


import {SignupForm} from "@/components/sign-up-form";

export default function SignupPage() {
    // Esta página simplemente renderiza el componente del formulario.
    // Se podrían añadir aquí comprobaciones de si el usuario ya está logueado,
    // pero por simplicidad, lo mantenemos así.
    return <SignupForm />;
}