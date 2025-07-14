import { Link, Outlet } from "react-router-dom";

const CuentaPage = () => {
    return (
        <div className="drawer lg:drawer-open">
            <input id="drawer-usuario" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content p-4">
                {/* Botón visible solo en móviles */}
                <label htmlFor="drawer-usuario" className="btn btn-primary drawer-button lg:hidden mb-4">
                    Abrir menú
                </label>

                {/* Contenido de cada apartado */}
                <Outlet />
            </div>

            <div className="drawer-side">
                <label htmlFor="drawer-usuario" className="drawer-overlay"></label>
                <ul className="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
                    <li><Link to="/cuenta/info">Información general</Link></li>
                   {/*<li><Link to="/cuenta/notificaciones">Notificaciones</Link></li>*/}
                    <li><Link to="/cuenta/ordenes">Compras</Link></li>
                    {/*<li><Link to="/cuenta/configuracion">Configuración</Link></li>*/}
                </ul>
            </div>
        </div>
    );
};

export default CuentaPage;
