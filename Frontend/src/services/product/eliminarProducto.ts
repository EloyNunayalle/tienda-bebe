import productosApi from "./apiProductos";
import { EliminarProductoRequest } from "../../interfaces/products/EliminarProductoRequest";
import { EliminarProductoResponse } from "../../interfaces/products/EliminarProductoResponse";

export async function eliminarProducto(
    request: EliminarProductoRequest,
    token: string
): Promise<EliminarProductoResponse> {
    const api = productosApi(token);

    try {
        const response = await api.delete<EliminarProductoResponse>({
            url: "/eliminar",
            data: request,
        });

        return response.data;
    } catch (error) {
        console.error("❌ Error al eliminar el producto:", error);
        throw new Error("Error inesperado al eliminar el producto");
    }
}
