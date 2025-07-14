import { ListarProductosRequest } from "../../interfaces/products/ListarProductosRequest";
import { ListarProductosResponse } from "../../interfaces/products/ListarProductosResponse";
import productosApi from "./apiProductos.ts";

export async function listarProductos(
    request: ListarProductosRequest
): Promise<ListarProductosResponse> {
    const api = productosApi(null); // sin token
    const response = await api.post<ListarProductosRequest, ListarProductosResponse>(
        request,
        { url: "/listar" }
    );
    return response.data;
}
