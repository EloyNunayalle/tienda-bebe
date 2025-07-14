import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarProductos } from "../services/product/ListarProductos";
import { ProductoItem } from "../interfaces/products/ProductoItem";

interface Props {
    categorias: { id: string; name: string }[];
}

const tenant_id = import.meta.env.VITE_DEFAULT_TENANT_ID;

const SearchBar = ({ categorias }: Props) => {
    const [texto, setTexto] = useState("");
    const [categoria, setCategoria] = useState<string>("");
    const [sugerencias, setSugerencias] = useState<string[]>([]);
    const [productos, setProductos] = useState<ProductoItem[]>([]);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    // 🔃 Cargar productos para autocompletado (una vez)
    useEffect(() => {
        const cargarProductos = async () => {
            if (!tenant_id) return;
            try {
                const res = await listarProductos({ tenant_id, limit: 10000 });
                setProductos(res.productos || []);
            } catch (error) {
                console.error("❌ Error cargando productos para autocompletado:", error);
            }
        };
        cargarProductos();
    }, []);

    // 🔍 Filtrar sugerencias mientras escribe
    useEffect(() => {
        const textoLower = texto.trim().toLowerCase();
        if (textoLower.length === 0) {
            setSugerencias([]);
            return;
        }
        const coincidencias = productos
            .map((p) => p.name)
            .filter((nombre) => nombre.toLowerCase().includes(textoLower));
        const unicos = Array.from(new Set(coincidencias)).slice(0, 5);
        setSugerencias(unicos);
    }, [texto, productos]);

    // 🔎 Redirigir a la página de búsqueda
    const handleBuscar = () => {
        const queryParams = new URLSearchParams();
        if (texto.trim()) queryParams.set("q", texto.trim());
        if (categoria.trim()) queryParams.set("cat", categoria.trim());
        navigate(`/buscar?${queryParams.toString()}`);
        setSugerencias([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleBuscar();
    };

    const handleSeleccionarSugerencia = (s: string) => {
        setTexto(s);
        const queryParams = new URLSearchParams();
        queryParams.set("q", s);
        if (categoria.trim()) queryParams.set("cat", categoria.trim());
        navigate(`/buscar?${queryParams.toString()}`);
        setSugerencias([]);
    };

    return (
        <div className="join w-full max-w-2xl mx-auto relative">
            <input
                ref={inputRef}
                className="input join-item w-full"
                placeholder="Buscar..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <select
                className="select join-item"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
            >
                <option value="">Todas las categorías</option>
                {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                        {cat.name}
                    </option>
                ))}
            </select>
            <button onClick={handleBuscar} className="btn join-item btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>

            {/* 🔽 Sugerencias */}
            {sugerencias.length > 0 && (
                <ul className="absolute top-full left-0 z-50 mt-1 w-full bg-white border border-gray-300 rounded shadow">
                    {sugerencias.map((s, i) => (
                        <li
                            key={i}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleSeleccionarSugerencia(s)}
                        >
                            {s}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchBar;
