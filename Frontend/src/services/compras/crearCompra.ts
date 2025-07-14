import comprasApi from "./apiCompras";
import {CompraRequest} from "../../interfaces/compras/CompraRequest.ts";
import {CompraResponse} from "../../interfaces/compras/CompraResponse.ts";

export async function crearCompra(
    request: CompraRequest,
    token: string
): Promise<CompraResponse> {
    const api = comprasApi(token);

    try {
        const response = await api.post<CompraRequest, CompraResponse>(request, {
            url: "/registrar",
        });

        return response.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("❌ Error al crear la compra:", error);
        throw new Error("Error inesperado al registrar la compra");
    }
}
