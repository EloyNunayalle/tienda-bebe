import { UserResponse } from "../../interfaces/user/UserResponse";
import { GetUserError } from "../../interfaces/user/GetUserError";
import { UserRequest } from "../../interfaces/user/UserRequest";
import usuariosApi from "../auth/apiUsuarios.ts";

export async function obtenerUser(
    request: UserRequest,
    token: string
): Promise<UserResponse | GetUserError> {
    const api = usuariosApi(token);

    try {
        const response = await api.post<UserRequest, UserResponse>(request, {
            url: "/obtener",
        });

        return response.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error.response?.data?.error) {
            return { error: error.response.data.error };
        }
        throw new Error("Error inesperado al obtener el usuario");
    }
}
