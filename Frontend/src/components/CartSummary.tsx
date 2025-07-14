import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { crearCompra } from "../services/compras/crearCompra";
import { CompraRequest } from "../interfaces/compras/CompraRequest";

const CartSummary = () => {
    const { items, total, clearCart } = useCart();
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    const [metodoPago, setMetodoPago] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalRedirect, setModalRedirect] = useState<null | (() => void)>(null);

    const handleCompra = async () => {
        if (items.length === 0) {
            setModalMessage("🛒 Tu carrito está vacío. Agrega productos antes de comprar.");
            setModalRedirect(null);
            return;
        }

        if (!isAuthenticated || !user) {
            setModalMessage("🔒 Necesitas iniciar sesión para completar la compra.");
            setModalRedirect(() => () => navigate("/login"));
            return;
        }

        if (!metodoPago) {
            setModalMessage("❗ Debes seleccionar un método de pago.");
            setModalRedirect(null);
            return;
        }

        try {
            const compra: CompraRequest = {
                productos: items.map(item => ({
                    producto_id: item.producto.producto_id,
                    nombre: item.producto.name,
                    precio: item.producto.price,
                    cantidad: item.cantidad,
                })),
            };

            await crearCompra(compra, user.token);
            clearCart();

            setModalMessage("✅ Compra realizada con éxito.");
            setModalRedirect(() => () => navigate("/buscar"));
        } catch (error) {
            console.error("❌ Error al procesar la compra:", error);
            setModalMessage("❌ Ocurrió un error al realizar la compra.");
            setModalRedirect(null);
        }
    };

    return (
        <>
            <div className="card bg-base-200 shadow-md p-5 w-full lg:w-80">
                <h2 className="text-lg font-bold mb-3">Resumen de tu compra:</h2>

                <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>S/ {total.toFixed(2)}</span>
                    </div>
                </div>

                {/* 🧾 Selector método de pago (solo visual) */}
                <div className="form-control mt-4">
                    <label className="label">
                        <span className="label-text font-medium">Método de pago</span>
                    </label>
                    <select
                        className="select select-bordered"
                        value={metodoPago}
                        onChange={(e) => setMetodoPago(e.target.value)}
                        required
                    >
                        <option value="">Selecciona</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="tarjeta">Tarjeta</option>
                    </select>
                </div>

                <div className="mt-5 space-y-2">
                    <button className="btn btn-primary btn-block" onClick={handleCompra}>
                        Comprar
                    </button>
                    <button className="btn btn-ghost btn-block" onClick={() => navigate("/buscar")}>
                        ⬅ Ver más productos
                    </button>
                </div>
            </div>

            {/* 🌟 Modal de confirmación / error */}
            {modalMessage && (
                <dialog id="modal-cart" className="modal modal-open">
                    <div className="modal-box text-center">
                        <h3 className="font-bold text-lg">Aviso</h3>
                        <p className="py-4">{modalMessage}</p>
                        <div className="modal-action">
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setModalMessage("");
                                    if (modalRedirect) modalRedirect();
                                }}
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </dialog>
            )}
        </>
    );
};

export default CartSummary;
