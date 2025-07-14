export interface ModificarProductoResponse {
    message: string;
    datosActualizados: {
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
