import comprasApi from "./apiCompras";
import { ListarComprasResponse } from "../../interfaces/compras/ListarComprasResponse.ts";

export async function listarCompras(token: string): Promise<ListarComprasResponse> {
    const api = comprasApi(token);

    try {
        const response = await api.post<{}, ListarComprasResponse>(
            {}, // el backend no necesita body
            { url: "/listar" }
        );

        return response.data;
    } catch (error) {
        console.error("❌ Error al listar las compras:", error);
        throw new Error("Error inesperado al obtener las compras");
    }
}
