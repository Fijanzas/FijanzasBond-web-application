
interface CreateUserPayload {
    username: string;
    email: string;
    password: string;
}

interface LoginPayload {
    username: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    username?: string;
    user_id?: number;
}

export interface ApiBondPayload {
    user_id: number;
    nominal_value: number;
    commercial_value: number;
    coupon_rate: number;
    market_rate: number;
    payment_frequency: number;
    duration: number;
    bonus: number;
    flotation: number;
    cavali: number;
    structuration?: number;
    colocation?: number;
    total_grace_period?: number;
    partial_grace_period?: number;
}

export interface ApiBondResponse {
    id: number;
    user_id: number;
    nominal_value:number
    commercial_value:number
    coupon_rate:number
    market_rate:number
    payment_frequency:number
    duration:number
    bonus:number
    flotation:number
    cavali:number
    structuration:number
    colocation:number
    total_grace_period: number
    partial_grace_period:number
}

export interface ApiFlow {
    bond_id: number;
    period: number;
    initial_balance: number;
    amortization: number;
    coupon: number;
    bonus: number;
    net_flow: number;
    final_balance: number;
}

export interface ApiResults {
    bond_id: number;
    TCEA: number;
    TREA: number;
    Precio_Maximo: number;
}

export interface ApiGetBondResponse extends ApiBondResponse {
    // Aquí puedes añadir más campos si el endpoint devuelve más datos que la lista
}

// --- Configuración ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// --- Cliente de API Genérico ---
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const config: RequestInit = {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
    };
    const response = await fetch(url, config);
    if (response.status === 204) {
        return null as T;
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Network error' }));
        throw new Error(errorData.detail || 'An unknown error occurred');
    }
    return response.json();
}

// --- Funciones Específicas de la API ---
export const apiClient = {
    createUser: (userData: CreateUserPayload) => {return request<{ message: string; username: string }>('/users', {method: 'POST', body: JSON.stringify(userData),}); },
    login: (credentials: LoginPayload) => request<LoginResponse>('/login', { method: 'POST', body: JSON.stringify(credentials) }),
    createBond: (bondData: ApiBondPayload) => request<ApiBondResponse>('/bonds', { method: 'POST', body: JSON.stringify(bondData) }),
    getBonds: (userId: number) => request<ApiBondResponse[]>(`/bonds/${userId}/bonds`),
    getBondFlows: (bondId: number) => request<ApiFlow[]>(`/bonds/${bondId}/flows`),
    getBondResults: (bondId: number) => request<ApiResults>(`/bonds/${bondId}/results`),
    getBondById: (bondId: number) => {
        return request<ApiGetBondResponse>(`/bonds/${bondId}`);
    },
    updateBond: (bondId: number, bondData: ApiBondPayload) => {
        return request<ApiBondResponse>(`/bonds/${bondId}`, {
            method: 'PUT',
            body: JSON.stringify(bondData),
        });
    },

    deleteBond: (bondId: number) => {
        // DELETE no devuelve contenido, por eso el tipo de respuesta es `null`
        return request<null>(`/bonds/${bondId}`, {
            method: 'DELETE',
        });
    },
};