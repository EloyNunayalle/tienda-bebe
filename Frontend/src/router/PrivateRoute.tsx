// src/components/PrivateRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {JSX} from "react";

interface Props {
    children: JSX.Element;
}

const PrivateRoute = ({ children }: Props) => {
    const { isAuthenticated } = useAuth();

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
