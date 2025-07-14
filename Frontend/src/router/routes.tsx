import { Routes, Route } from "react-router-dom";
import RegisterPage from "../pages/RegisterPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import Layout from "../components/Layout";
import CuentaPage from "../pages/CuentaPage.tsx";
import NotificacionesPage from "../pages/cuenta/NotificacionesPage.tsx";
import OrdenesPage from "../pages/cuenta/OrdenesPage.tsx";
import InfoPage from "../pages/cuenta/InfoPage.tsx";
import PrivateRoute from "./PrivateRoute.tsx";
import BuscarPage from "../pages/BuscarPage.tsx";
import CartPage from "../pages/CartPage.tsx";
import AdministradorOrdenesPage from "../pages/AdministradorOrdenesPage.tsx";

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                {/* Todas estas páginas tendrán el navbar porque están dentro del Layout */}
                <Route index element={<HomePage />} />
                <Route path="buscar" element={<BuscarPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="/carrito" element={<CartPage />} />
                <Route path="/admin" element={<AdministradorOrdenesPage />} />

                {/* Página de cuenta */}
                {/* 🔒 Rutas protegidas */}
                <Route path="cuenta" element={
                    <PrivateRoute>
                        <CuentaPage />
                    </PrivateRoute>
                }>
                    <Route path="info" element={<InfoPage />} />
                    <Route path="notificaciones" element={<NotificacionesPage />} />
                    <Route path="ordenes" element={<OrdenesPage />} />
                </Route>
            </Route>

        </Routes>
    );
};

export default AppRoutes;