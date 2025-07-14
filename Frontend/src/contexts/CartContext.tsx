import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ProductoItem } from "../interfaces/products/ProductoItem";

export interface CartItem {
    producto: ProductoItem;
    cantidad: number;
}

interface CartContextType {
    items: CartItem[];
    total: number;
    addProduct: (producto: ProductoItem, cantidad: number) => void;
    updateQuantity: (productId: string, cantidad: number) => void;
    removeProduct: (productId: string) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem("cart");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setItems(parsed.items || []);
                setTotal(parsed.total || 0);
            } catch (error) {
                console.error("❌ Error al cargar el carrito desde localStorage:", error);
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            const totalCalc = items.reduce(
                (sum, item) => sum + item.producto.price * item.cantidad,
                0
            );
            setTotal(totalCalc);
            localStorage.setItem("cart", JSON.stringify({ items, total: totalCalc }));
        }
    }, [items, isLoading]);

    const addProduct = (producto: ProductoItem, cantidad: number) => {
        setItems((prev) => {
            const existingItem = prev.find((item) => item.producto.producto_id === producto.producto_id);

            if (existingItem) {
                return prev.map((item) =>
                    item.producto.producto_id === producto.producto_id
                        ? { ...item, cantidad: item.cantidad + cantidad }
                        : item
                );
            }

            return [...prev, { producto, cantidad }];
        });
    };

    const updateQuantity = (productId: string, cantidad: number) => {
        setItems((prev) =>
            prev.map((item) =>
                item.producto.producto_id === productId ? { ...item, cantidad } : item
            ).filter((item) => item.cantidad > 0)
        );
    };

    const removeProduct = (productId: string) => {
        setItems((prev) => prev.filter((item) => item.producto.producto_id !== productId));
    };

    const clearCart = () => {
        setItems([]);
    };

    if (isLoading) return null;

    return (
        <CartContext.Provider value={{ items, total, addProduct, updateQuantity, removeProduct, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart debe estar dentro de <CartProvider>");
    return context;
};
