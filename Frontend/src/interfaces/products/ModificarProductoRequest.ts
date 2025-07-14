export interface ModificarProductoRequest {
    producto_id: string;
    tenant_id: string;
    producto_datos: {
        name?: string;
        description?: string;
        price?: number;
        category_id?: string;
        age?: number;
        gender?: string;
        type?: string;
        availability?: string;
        imageUrl?: string;
    };
}
