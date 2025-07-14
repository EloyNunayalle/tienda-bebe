import productosApi from "./apiProductos";
import { ModificarProductoRequest } from "../../interfaces/products/ModificarProductoRequest";
import { ModificarProductoResponse } from "../../interfaces/products/ModificarProductoResponse";

export async function modificarProducto(
    request: ModificarProductoRequest,
    token: string
): Promise<ModificarProductoResponse> {
    const api = productosApi(token);

    try {
        const response = await api.put<ModificarProductoRequest, ModificarProductoResponse>(request, {
            url: "/modificar",
        });

        return response.data;
    } catch (error) {
        console.error("❌ Error al modificar el producto:", error);
        throw new Error("Error inesperado al modificar el producto");
    }
}
