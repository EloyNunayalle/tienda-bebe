export interface CompraProducto {
    producto_id: string;
    nombre: string;
    precio: number;
    cantidad?: number;
}

export interface CompraRequest {
    productos: CompraProducto[];
}
