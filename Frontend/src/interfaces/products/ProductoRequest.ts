export interface ProductoRequest {
    tenant_id: string;
    producto_id?: string;       // ← ahora opcional
    name: string;
    description: string;
    price: number;
    category_id: string;
    age: number;
    gender: string;
    type: string;
    availability: string;
    imageUrl?: string;          // ← ahora opcional
}
