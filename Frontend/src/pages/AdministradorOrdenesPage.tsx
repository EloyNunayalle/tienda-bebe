import { FormEvent, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

/* ── servicios ─────────────────────────────────── */
import { obtenerProducto }   from "../services/product/obtenerProducto";
import { crearProducto }     from "../services/product/crearProducto";
import { subirImagenProducto } from "../services/product/subirImagenProducto";
import { modificarProducto } from "../services/product/modificarProducto";
import { eliminarProducto }  from "../services/product/eliminarProducto";
import { listarProductos }   from "../services/product/ListarProductos";

/* ── tipos / interfaces ─────────────────────────── */
import { ProductoItem }                 from "../interfaces/products/ProductoItem";
import { ProductoRequest }              from "../interfaces/products/ProductoRequest";
import { ProductoResponse }             from "../interfaces/products/ProductoResponse";
import { ObtenerProductoResponse }      from "../interfaces/products/ObtenerProductoResponse";
import { ModificarProductoRequest }     from "../interfaces/products/ModificarProductoRequest";
import { ModificarProductoResponse }    from "../interfaces/products/ModificarProductoResponse";
import { EliminarProductoResponse }     from "../interfaces/products/EliminarProductoResponse";

type Tab = "buscar" | "crear" | "modificar" | "eliminar" | "listar";

interface Visor {
    operacion: string;
    payload: unknown;
}

/* ── valores iniciales para inputs de crear ─────── */
const INITIAL_FIELDS = {
    name: "",
    description: "",
    price: "",
    category_id: "",
    age: "",
    gender: "",
    type: "",
    availability: "",
};

const AdministradorProductosPage = () => {
    /* ── contexto ── */
    const { user } = useAuth();
    const tenant_id = user?.tenant_id ?? "";
    const token     = user?.token     ?? "";

    /* ── pestaña activa ── */
    const [tab, setTab] = useState<Tab>("buscar");

    /* ───── BUSCAR ───── */
    const [buscarId, setBuscarId] = useState("");
    const [buscarProducto, setBuscarProducto] = useState<ProductoItem | null>(null);

    /* ───── CREAR ───── */
    const [crearData, setCrearData] = useState({ ...INITIAL_FIELDS });
    const crearFile = useRef<File | null>(null);

    /* ───── MODIFICAR ───── */
    const [modifId, setModifId]     = useState("");
    const [modifData, setModifData] = useState<ModificarProductoRequest["producto_datos"]>({});
    const modifFile = useRef<File | null>(null);

    /* ───── ELIMINAR ───── */
    const [elimId, setElimId] = useState("");

    /* ───── LISTAR ───── */
    const [listLimit, setListLimit]         = useState("20");
    const [listProductos, setListProductos] = useState<ProductoItem[]>([]);
    const [listLoading, setListLoading]     = useState(false);

    /* ───── VISOR GENERAL ───── */
    const [visor, setVisor] = useState<Visor | null>(null);
    const showVisor = (operacion: string, payload: unknown) =>
        setVisor({ operacion, payload });

    /* ═══════════ HANDLERS ═══════════ */

    /* --- BUSCAR --- */
    const handleBuscar = async (e: FormEvent) => {
        e.preventDefault();
        if (!buscarId.trim()) return;

        try {
            const resp: ObtenerProductoResponse = await obtenerProducto({
                tenant_id,
                producto_id: buscarId.trim(),
            });
            setBuscarProducto(resp);          // card detallada
            showVisor("buscarProducto → OK", resp);
        } catch (err) {
            setBuscarProducto(null);
            showVisor("buscarProducto → ERROR", (err as Error).message ?? err);
        }
    };

    /* --- CREAR --- */
    const handleCrear = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const req: ProductoRequest = {
                tenant_id,
                ...crearData,
                price: crearData.price === "" ? 0 : Number(crearData.price),
                age  : crearData.age   === "" ? 0 : Number(crearData.age),
            };

            const resp: ProductoResponse = await crearProducto(req, token);
            let imageUrl = resp.imageUrl;
            const producto_id = resp.producto_id;

            if (crearFile.current) {
                const up = await subirImagenProducto(
                    token, tenant_id, producto_id, crearData.name, crearFile.current
                );
                imageUrl = up.imageUrl;

                await modificarProducto(
                    { tenant_id, producto_id, producto_datos: { imageUrl } },
                    token
                );
            }

            showVisor("crearProducto → OK", { ...resp, imageUrl });
            setCrearData({ ...INITIAL_FIELDS });
            crearFile.current = null;
        } catch (err) {
            showVisor("crearProducto → ERROR", (err as Error).message ?? err);
        }
    };

    /* --- MODIFICAR --- */
    const handleModificar = async (e: FormEvent) => {
        e.preventDefault();
        if (!modifId.trim()) return;

        try {
            let imageUrl: string | undefined;
            if (modifFile.current) {
                const up = await subirImagenProducto(
                    token, tenant_id, modifId.trim(), modifData.name ?? "imagen", modifFile.current
                );
                imageUrl = up.imageUrl;
            }

            const datos = { ...modifData, ...(imageUrl ? { imageUrl } : {}) };
            const resp: ModificarProductoResponse = await modificarProducto(
                { tenant_id, producto_id: modifId.trim(), producto_datos: datos },
                token
            );

            showVisor("modificarProducto → OK", resp);
            setModifId(""); setModifData({}); modifFile.current = null;
        } catch (err) {
            showVisor("modificarProducto → ERROR", (err as Error).message ?? err);
        }
    };

    /* --- ELIMINAR --- */
    const handleEliminar = async (e: FormEvent) => {
        e.preventDefault();
        if (!elimId.trim()) return;

        try {
            const resp: EliminarProductoResponse = await eliminarProducto(
                { tenant_id, producto_id: elimId.trim() }, token
            );
            showVisor("eliminarProducto → OK", resp);
            setElimId("");
        } catch (err) {
            showVisor("eliminarProducto → ERROR", (err as Error).message ?? err);
        }
    };

    /* --- LISTAR --- */
    const handleListar = async (e: FormEvent) => {
        e.preventDefault();
        setListProductos([]); setVisor(null);

        if (!listLimit.trim()) return;
        try {
            setListLoading(true);
            const limit = Number(listLimit) || 10;
            const resp  = await listarProductos({ tenant_id, limit });
            setListProductos(resp.productos);
        } catch (err) {
            alert(`Error al listar productos: ${(err as Error).message ?? err}`);
        } finally {
            setListLoading(false);
        }
    };

    /* ═══════════ UI (solo admin) ═══════════ */
    if (!user || user.rol !== "admin") {
        return (
            <div className="pt-20 text-center">
                🔒 Acceso restringido – Solo administradores.
            </div>
        );
    }

    return (
        <div className="pt-20 px-4 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">

            {/* ═════── Panel de formularios ──═════ */}
            <div className="flex-1 space-y-6">

                {/* Tabs */}
                <div className="tabs tabs-boxed">
                    {(["buscar", "crear", "modificar", "eliminar", "listar"] as Tab[]).map((t) => (
                        <a
                            key={t}
                            className={`tab ${tab === t ? "tab-active" : ""}`}
                            onClick={() => setTab(t)}
                        >
                            {t.toUpperCase()}
                        </a>
                    ))}
                </div>

                {/* ░░░░░ BUSCAR ░░░░░ */}
                {tab === "buscar" && (
                    <>
                        <form onSubmit={handleBuscar} className="card bg-base-200 p-6 space-y-4">
                            <h2 className="font-bold text-lg">Buscar producto</h2>

                            <label className="form-control">
                                <span className="label-text">producto_id</span>
                                <input
                                    className="input input-bordered w-full"
                                    value={buscarId}
                                    onChange={(e) => setBuscarId(e.target.value)}
                                    required
                                />
                            </label>

                            <button className="btn btn-primary">Buscar</button>
                        </form>

                        {/* Resultado visual debajo */}
                        {buscarProducto && (
                            <div className="card bg-base-100 shadow p-4">
                                <div className="flex gap-4">
                                    {buscarProducto.imageUrl && (
                                        <img
                                            src={buscarProducto.imageUrl}
                                            alt={buscarProducto.name}
                                            className="w-24 h-24 object-cover rounded"
                                        />
                                    )}

                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2">
                                            {buscarProducto.name}{" "}
                                            <span className="text-xs font-normal text-gray-400">
                        ({buscarProducto.producto_id})
                      </span>
                                        </h3>

                                        <ul className="text-sm leading-relaxed space-y-1">
                                            <li><b>Descripción:</b> {buscarProducto.description}</li>
                                            <li><b>Precio:</b> S/ {buscarProducto.price.toFixed(2)}</li>
                                            <li><b>Categoría:</b> {buscarProducto.category_id}</li>
                                            <li><b>Edad:</b> {buscarProducto.age}</li>
                                            <li><b>Género:</b> {buscarProducto.gender}</li>
                                            <li><b>Tipo:</b> {buscarProducto.type}</li>
                                            <li><b>Disponibilidad:</b> {buscarProducto.availability}</li>
                                            <li><b>Creado:</b>{" "}
                                                {new Date(buscarProducto.createdAt ?? "").toLocaleString()}
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ░░░░░ CREAR ░░░░░ */}
                {tab === "crear" && (
                    <form onSubmit={handleCrear} className="card bg-base-200 p-6 space-y-4">
                        <h2 className="font-bold text-lg">Crear producto</h2>

                        {/* grid de dos columnas para mejor alineado */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(Object.keys(INITIAL_FIELDS) as Array<keyof typeof INITIAL_FIELDS>).map((key) => (
                                <label key={key} className="form-control">
                                    <span className="label-text capitalize">{key}</span>
                                    <input
                                        className="input input-bordered"
                                        value={crearData[key] as string}
                                        onChange={(e) =>
                                            setCrearData((p) => ({ ...p, [key]: e.target.value }))
                                        }
                                        required
                                        type={key === "price" || key === "age" ? "number" : "text"}
                                    />
                                </label>
                            ))}
                        </div>

                        <label className="form-control">
                            <span className="label-text">Imagen JPG</span>
                            <input
                                type="file"
                                accept="image/jpeg"
                                className="file-input file-input-bordered"
                                onChange={(e) => (crearFile.current = e.target.files?.[0] || null)}
                            />
                        </label>

                        <button className="btn btn-primary">Crear (&nbsp;subir imagen&nbsp;)</button>
                    </form>
                )}

                {/* ░░░░░ MODIFICAR ░░░░░ */}
                {tab === "modificar" && (
                    <form onSubmit={handleModificar} className="card bg-base-200 p-6 space-y-4">
                        <h2 className="font-bold text-lg">Modificar producto</h2>

                        <label className="form-control">
                            <span className="label-text">producto_id *</span>
                            <input
                                className="input input-bordered"
                                value={modifId}
                                onChange={(e) => setModifId(e.target.value)}
                                required
                            />
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {([
                                "name", "description", "price", "category_id",
                                "age", "gender", "type", "availability",
                            ] as const).map((key) => (
                                <label key={key} className="form-control">
                                    <span className="label-text capitalize">{key} (opcional)</span>
                                    <input
                                        className="input input-bordered"
                                        type={key === "price" || key === "age" ? "number" : "text"}
                                        value={modifData[key] !== undefined ? String(modifData[key]) : ""}
                                        onChange={(e) =>
                                            setModifData((p) => ({
                                                ...p,
                                                [key]:
                                                    key === "price" || key === "age"
                                                        ? (e.target.value ? Number(e.target.value) : undefined)
                                                        : e.target.value || undefined,
                                            }))
                                        }
                                    />
                                </label>
                            ))}
                        </div>

                        <label className="form-control">
                            <span className="label-text">Nueva imagen JPG (opcional)</span>
                            <input
                                type="file"
                                accept="image/jpeg"
                                className="file-input file-input-bordered"
                                onChange={(e) => (modifFile.current = e.target.files?.[0] || null)}
                            />
                        </label>

                        <button className="btn btn-primary">Modificar</button>
                    </form>
                )}

                {/* ░░░░░ ELIMINAR ░░░░░ */}
                {tab === "eliminar" && (
                    <form onSubmit={handleEliminar} className="card bg-base-200 p-6 space-y-4">
                        <h2 className="font-bold text-lg">Eliminar producto</h2>

                        <label className="form-control">
                            <span className="label-text">producto_id</span>
                            <input
                                className="input input-bordered"
                                value={elimId}
                                onChange={(e) => setElimId(e.target.value)}
                                required
                            />
                        </label>

                        <button className="btn btn-error text-white">Eliminar</button>
                    </form>
                )}

                {/* ░░░░░ LISTAR ░░░░░ */}
                {tab === "listar" && (
                    <>
                        {/* formulario listar */}
                        <form onSubmit={handleListar} className="card bg-base-200 p-6 space-y-4">
                            <h2 className="font-bold text-lg">Listar productos</h2>

                            <label className="form-control">
                                <span className="label-text">limit</span>
                                <input
                                    type="number"
                                    min={1}
                                    className="input input-bordered"
                                    value={listLimit}
                                    onChange={(e) => setListLimit(e.target.value)}
                                    required
                                />
                            </label>

                            <button className="btn btn-primary">Listar</button>
                        </form>

                        {/* resultados listar */}
                        <div className="mt-6">
                            {listLoading ? (
                                <div className="loading loading-spinner text-primary"></div>
                            ) : listProductos.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    {listLimit ? "Sin resultados." : "Ingresa un límite y busca."}
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {listProductos.map((p) => (
                                        <div key={p.producto_id} className="card bg-base-100 shadow p-4">
                                            <div className="flex gap-4">
                                                {p.imageUrl && (
                                                    <img
                                                        src={p.imageUrl}
                                                        alt={p.name}
                                                        className="w-24 h-24 object-cover rounded"
                                                    />
                                                )}

                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg mb-2">
                                                        {p.name}{" "}
                                                        <span className="text-xs font-normal text-gray-400">
                              ({p.producto_id})
                            </span>
                                                    </h3>

                                                    <ul className="text-sm leading-relaxed space-y-1">
                                                        <li><b>Descripción:</b> {p.description}</li>
                                                        <li><b>Precio:</b> S/ {p.price.toFixed(2)}</li>
                                                        <li><b>Categoría:</b> {p.category_id}</li>
                                                        <li><b>Edad:</b> {p.age}</li>
                                                        <li><b>Género:</b> {p.gender}</li>
                                                        <li><b>Tipo:</b> {p.type}</li>
                                                        <li><b>Disponibilidad:</b> {p.availability}</li>
                                                        <li><b>Creado:</b>{" "}
                                                            {new Date(p.createdAt ?? "").toLocaleString()}
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ═════── Visor lateral ──═════ */}
            <div className="w-full lg:w-96">
                <div className="card bg-base-100 shadow-md p-4 sticky top-24">
                    <h2 className="font-bold mb-2">Visor de respuesta</h2>
                    {visor ? (
                        <>
                            <div className="badge badge-primary mb-2">{visor.operacion}</div>
                            <pre className="bg-base-200 p-2 overflow-x-auto text-xs">
{JSON.stringify(visor.payload, null, 2)}
              </pre>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">
                            No hay respuesta todavía. Realiza alguna operación.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdministradorProductosPage;
