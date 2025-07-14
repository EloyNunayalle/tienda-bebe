export interface StartKey {
    producto_id: string;
    tenant_id: string;
}

export interface ListarProductosRequest {
    tenant_id: string;
    limit: number;
    start_key?: StartKey;
}
