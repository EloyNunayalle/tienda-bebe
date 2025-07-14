import { CartItem as CartItemType } from "../contexts/CartContext";
import { useCart } from "../contexts/CartContext";

const CartItem = ({ item }: { item: CartItemType }) => {
    const { updateQuantity, removeProduct } = useCart();
    const { producto, cantidad } = item;

    const incrementar = () => {
        updateQuantity(producto.producto_id, cantidad + 1);
    };

    const decrementar = () => {
        if (cantidad > 1) updateQuantity(producto.producto_id, cantidad - 1);
    };

    const eliminar = () => {
        removeProduct(producto.producto_id);
    };

    return (
        <div className="card bg-base-200 shadow-sm mb-4">
            <div className="card-body flex flex-row justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="avatar">
                        <div className="w-20 rounded">
                            <img
                                src={producto.imageUrl || "https://via.placeholder.com/400x200?text=Producto"}
                                alt={producto.name}
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="font-semibold">{producto.name}</h2>
                        <div className="mt-2 text-sm space-y-1">
                            <p>
                                <span className="line-through text-gray-400">
                                    S/ {(producto.price * 1.09).toFixed(2)}
                                </span>
                            </p>
                            <p className="text-orange-600 font-bold">
                                S/ {producto.price.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        <button onClick={decrementar} className="btn btn-sm btn-circle">
                            -
                        </button>
                        <span>{cantidad}</span>
                        <button onClick={incrementar} className="btn btn-sm btn-circle">
                            +
                        </button>
                    </div>
                    <p className="text-sm text-gray-600">
                        Subtotal: <strong>S/ {(producto.price * cantidad).toFixed(2)}</strong>
                    </p>
                    <button
                        onClick={eliminar}
                        className="btn btn-xs btn-error text-white mt-1"
                    >
                        🗑 Quitar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartItem;
