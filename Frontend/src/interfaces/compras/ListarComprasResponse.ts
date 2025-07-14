export interface CompraProductoItem {
    producto_id: string;
    nombre: string;
    precio: string;
    cantidad: string;
}

export interface CompraItem {
    compra_id: string;
    tenant_id: string;
    user_id: string;
    productos: CompraProductoItem[];
    total: string;
    fecha: string; // formato "YYYY-MM-DD HH:mm:ss"
}

export interface ListarComprasResponse {
    compras: CompraItem[];
    cantidad: number;
}
