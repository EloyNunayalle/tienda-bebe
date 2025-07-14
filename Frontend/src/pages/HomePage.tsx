import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";
import { listarProductos } from "../services/product/ListarProductos";
import { ProductoItem } from "../interfaces/products/ProductoItem";
import { StartKey } from "../interfaces/products/ListarProductosRequest";

const tenant_id = import.meta.env.VITE_DEFAULT_TENANT_ID;

const HomePage = () => {
    const location = useLocation();
    const [pagina, setPagina] = useState(1);
    const [productos, setProductos] = useState<ProductoItem[]>([]);
    const [startKeys, setStartKeys] = useState<(StartKey | null)[]>([null]);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);

    const productosPorPagina = pagina === 1 ? 16 : 32;

    useEffect(() => {
        console.log("🔄 Reiniciando a página 1 y startKeys");
        setPagina(1);
        setStartKeys([null]);
    }, [location.key]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [pagina]);

    useEffect(() => {
        const fetchData = async () => {
            if (!tenant_id) {
                console.error("❌ tenant_id no definido en .env");
                return;
            }

            setLoading(true);
            const start_key = startKeys[pagina - 1] ?? undefined;

            console.log("📤 Enviando request listarProductos:", {
                tenant_id,
                limit: productosPorPagina,
                start_key,
            });

            try {
                const response = await listarProductos({
                    tenant_id,
                    limit: productosPorPagina,
                    start_key,
                });

                console.log("✅ Respuesta:", response);
                setProductos(response.productos);
                setHasMore(!!response.lastEvaluatedKey);

                if (response.lastEvaluatedKey && startKeys.length === pagina) {
                    setStartKeys((prev) => [...prev, response.lastEvaluatedKey!]);
                }
            } catch (error) {
                console.error("❌ Error al obtener productos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [pagina, startKeys]);

    return (
        <div className="pt-20 px-4 space-y-6">
            {pagina === 1 && (
                <img
                    src="/images/Home%20(2).png"
                    alt="Imagen destacada"
                    className="w-full h-auto rounded-xl shadow object-contain"
                />
            )}

            {loading ? (
                <div className="text-center py-20">Cargando productos...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {productos.map((producto) => (
                            <ProductCard key={producto.producto_id} product={producto} />
                        ))}
                    </div>

                    <div className="flex justify-center mt-4">
                        <Pagination
                            currentPage={pagina}
                            hasMore={hasMore}
                            onPageChange={setPagina}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default HomePage;
