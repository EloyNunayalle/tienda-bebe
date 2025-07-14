import Api from "../api.ts";

const productosApi = (token: string | null) =>
    new Api(import.meta.env.VITE_PRODUCTOS_URL, token);

export default productosApi;
