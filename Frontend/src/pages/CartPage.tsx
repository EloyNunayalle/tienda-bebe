// src/pages/CartPage.tsx
import { useCart } from "../contexts/CartContext";
import CartItem from "../components/CartItem";
import CartSummary from "../components/CartSummary";

const CartPage = () => {
    const { items } = useCart();

    return (
        <div className="pt-20 px-4">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                🛒 Carro de compras
            </h1>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* 🧾 Lista de productos */}
                <div className="flex-1 space-y-4">
                    {items.length > 0 ? (
                        items.map((item) => (
                            <CartItem key={item.producto.producto_id} item={item} />
                        ))
                    ) : (
                        <p className="text-gray-500">Tu carrito está vacío.</p>
                    )}
                </div>

                {/* 📦 Resumen */}
                <div className="w-full lg:w-80 self-start">
                    <CartSummary />
                </div>
            </div>
        </div>
    );
};

export default CartPage;
