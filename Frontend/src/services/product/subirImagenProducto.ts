export interface SubirImagenResponse {
    message: string;
    imageUrl: string;
}

export async function subirImagenProducto(
    token: string,
    tenant_id: string,
    producto_id: string,
    name: string,
    file: File
): Promise<SubirImagenResponse> {
    const formData = new FormData();
    formData.append("tenant_id", tenant_id);
    formData.append("producto_id", producto_id);
    formData.append("name", name);
    formData.append("file", file);

    try {
        const response = await fetch(
            `${import.meta.env.VITE_PRODUCTOS_URL}/subirimagen`,
            {
                method: "POST",
                headers: {
                    Authorization: token,
                },
                body: formData,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error ${response.status}`);
        }

        const data = await response.json();
        return {
            message: data.message,
            imageUrl: data.imageUrl,
        };
    } catch (err) {
        console.error("❌ Error al subir imagen:", err);
        throw new Error("No se pudo subir la imagen");
    }
}
