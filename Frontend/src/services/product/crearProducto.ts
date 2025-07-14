import productosApi from "./apiProductos";
import { ProductoRequest } from "../../interfaces/products/ProductoRequest";
import { ProductoResponse } from "../../interfaces/products/ProductoResponse";

export async function crearProducto(
    request: ProductoRequest,
    token: string
): Promise<ProductoResponse> {
    const api = productosApi(token);

    try {
        const response = await api.post<ProductoRequest, ProductoResponse>(request, {
            url: "/crear",
        });

        return response.data;
    } catch (error) {
        console.error("❌ Error al crear el producto:", error);
        throw new Error("Error inesperado al registrar el producto");
    }
}
