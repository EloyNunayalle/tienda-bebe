import Api from "../api.ts";

const comprasApi = (token: string | null) =>
    new Api(import.meta.env.VITE_COMPRAS_URL, token);

export default comprasApi;
