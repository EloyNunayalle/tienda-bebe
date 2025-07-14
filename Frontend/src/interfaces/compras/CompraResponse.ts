export interface CompraProductoResponse {
    producto_id: string;
    nombre: string;
    precio: string;   // el backend lo envía como string
    cantidad: string; // también como string
}

export interface CompraDetalle {
    tenant_id: string;
    compra_id: string;
    user_id: string;
    productos: CompraProductoResponse[];
    total: string; // string según el JSON
    fecha: string; // formato "YYYY-MM-DD HH:mm:ss"
}

export interface CompraResponse {
    message: string;
    compra: CompraDetalle;
}
