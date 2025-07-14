import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { listarCompras } from "../../services/compras/ListarCompras";
import { obtenerProducto } from "../../services/product/obtenerProducto";
import { CompraItem } from "../../interfaces/compras/ListarComprasResponse";

interface ProductoConImagen {
    producto_id: string;
    nombre: string;
    precio: string;
    cantidad: string;
    imageUrl?: string;
}

interface CompraConDetalles extends CompraItem {
    productosConImagen: ProductoConImagen[];
}

const OrdenesPage = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [compras, setCompras] = useState<CompraConDetalles[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarCompras = async () => {
            if (!isAuthenticated || !user || !user.token) {
                navigate("/login");
                return;
            }

            try {
                const res = await listarCompras(user.token);
                const ordenadas = [...res.compras].sort(
                    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
                );

                const detalladas: CompraConDetalles[] = [];

                for (const compra of ordenadas) {
                    const productosConImagen: ProductoConImagen[] = [];

                    for (const p of compra.productos) {
                        try {
                            const prod = await obtenerProducto({
                                tenant_id: user.tenant_id,
                                producto_id: p.producto_id,
                            });

                            productosConImagen.push({
                                ...p,
                                imageUrl: prod.imageUrl,
                            });
                        } catch (error) {
                            console.log(error);
                            productosConImagen.push(p); // sin imagen si falla
                        }
                    }

                    detalladas.push({ ...compra, productosConImagen });
                }

                setCompras(detalladas);
            } catch (e) {
                console.error("❌ Error al cargar compras:", e);
            } finally {
                setLoading(false);
            }
        };

        cargarCompras();
    }, [user, isAuthenticated, navigate]);

    if (loading) {
        return <div className="pt-20 text-center">Cargando compras...</div>;
    }

    return (
        <div className="pt-20 px-4">
            <h1 className="text-2xl font-bold mb-6">🛍️ Historial de compras</h1>

            {compras.length === 0 ? (
                <p>No se encontraron compras registradas.</p>
            ) : (
                <div className="space-y-6">
                    {compras.map((compra) => (
                        <div key={compra.compra_id} className="card bg-base-100 shadow-md p-4">
                            <div className="text-sm text-gray-500 mb-1">
                                ID Compra: {compra.compra_id}
                            </div>
                            <div className="text-sm text-gray-500 mb-1">
                                Fecha: {new Date(compra.fecha).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500 mb-1">
                                Usuario: {compra.user_id}
                            </div>
                            <div className="text-sm text-gray-500 mb-4">
                                Total: <span className="font-bold text-primary">S/ {parseFloat(compra.total).toFixed(2)}</span>
                            </div>

                            <div className="space-y-3">
                                {compra.productosConImagen.map((prod, i) => (
                                    <div key={i} className="flex items-center gap-4 border-b pb-2">
                                        {prod.imageUrl && (
                                            <img
                                                src={prod.imageUrl}
                                                alt={prod.nombre}
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                        )}
                                        <div className="flex-grow">
                                            <div className="font-semibold">{prod.nombre}</div>
                                            <div className="text-sm text-gray-500">Cantidad: {prod.cantidad}</div>
                                        </div>
                                        <div className="text-right text-sm">
                                            <div>Precio: S/ {parseFloat(prod.precio).toFixed(2)}</div>
                                            <div className="text-xs text-gray-400">
                                                Subtotal: S/ {(parseFloat(prod.precio) * parseInt(prod.cantidad)).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrdenesPage;
