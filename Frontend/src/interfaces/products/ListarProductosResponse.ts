import { ProductoItem } from "./ProductoItem";

export interface ListarProductosResponse {
    productos: ProductoItem[];
    lastEvaluatedKey?: {
        producto_id: string;
        tenant_id: string;
    } | null;
}
