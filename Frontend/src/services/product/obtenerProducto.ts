import { ObtenerProductoRequest } from "../../interfaces/products/ObtenerProductoRequest";
import { ObtenerProductoResponse } from "../../interfaces/products/ObtenerProductoResponse";
import productosApi from "./apiProductos.ts";

export async function obtenerProducto(
    request: ObtenerProductoRequest
): Promise<ObtenerProductoResponse> {
    const api = productosApi(null); // sin token
    const response = await api.post<ObtenerProductoRequest, ObtenerProductoResponse>(
        request,
        { url: "/buscar" }
    );
    return response.data;
}
