import Api from "../api.ts";

const usuariosApi = (token: string | null) =>
    new Api(import.meta.env.VITE_USUARIOS_URL, token);

export default usuariosApi;
