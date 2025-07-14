import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";
import { listarProductos } from "../services/product/ListarProductos";
import { ProductoItem } from "../interfaces/products/ProductoItem";
import { StartKey } from "../interfaces/products/ListarProductosRequest";

const tenant_id = import.meta.env.VITE_DEFAULT_TENANT_ID;

const BuscarPage = () => {
    const location = useLocation();
    const [params] = useSearchParams();

    const query = params.get("q")?.toLowerCase().trim() || "";
    const cat = params.get("cat")?.toLowerCase().trim() || "";

    const [pagina, setPagina] = useState(1);
    const [productos, setProductos] = useState<ProductoItem[]>([]);
    const [startKeys, setStartKeys] = useState<(StartKey | null)[]>([null]);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);

    const modoBusqueda = query !== "" || cat !== "";
    const productosPorPagina = 32;
    const productosPorBusqueda = 5000;

    // 🔄 Reiniciar al cambiar búsqueda
    useEffect(() => {
        setPagina(1);
        setStartKeys([null]);
        setProductos([]);
    }, [query, cat, location.key]);

    // ↕️ Ir arriba al cambiar de página
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [pagina]);

    // 📦 Obtener productos
    useEffect(() => {
        const fetchData = async () => {
            if (!tenant_id) return;

            const start_key = modoBusqueda ? undefined : startKeys[pagina - 1] ?? undefined;
            const limit = modoBusqueda ? productosPorBusqueda : productosPorPagina;

            setLoading(true);
            try {
                const response = await listarProductos({ tenant_id, limit, start_key });
                const nuevos = response.productos;

                if (modoBusqueda) {
                    setProductos(nuevos);
                    setHasMore(false);
                } else {
                    setProductos(nuevos);
                    setHasMore(!!response.lastEvaluatedKey);
                    if (response.lastEvaluatedKey && startKeys.length === pagina) {
                        setStartKeys((prev) => [...prev, response.lastEvaluatedKey!]);
                    }
                }
            } catch (error) {
                console.error("❌ Error al obtener productos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [pagina, startKeys, modoBusqueda, query, cat]);

    // 🔍 Filtro si hay búsqueda
    const productosFiltrados = useMemo(() => {
        if (!modoBusqueda) return productos;

        return productos.filter((p) =>
            p.name.toLowerCase().includes(query) &&
            (!cat || String(p.category_id).toLowerCase() === cat)
        );
    }, [productos, query, cat, modoBusqueda]);

    const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
    const productosPagina = modoBusqueda
        ? productosFiltrados.slice((pagina - 1) * productosPorPagina, pagina * productosPorPagina)
        : productosFiltrados;

    return (
        <div className="pt-20 px-4 space-y-6">
            {loading ? (
                <div className="text-center py-20">Cargando productos...</div>
            ) : productosFiltrados.length === 0 ? (
                <div className="text-center py-20 text-gray-500">🔍 No se encontraron productos.</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {productosPagina.map((producto) => (
                            <ProductCard key={producto.producto_id} product={producto} />
                        ))}
                    </div>

                    <div className="flex justify-center mt-4">
                        <Pagination
                            currentPage={pagina}
                            hasMore={modoBusqueda ? pagina < totalPaginas : hasMore}
                            onPageChange={setPagina}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default BuscarPage;
