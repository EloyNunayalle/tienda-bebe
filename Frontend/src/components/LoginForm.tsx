import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoginRequest } from "../interfaces/auth/LoginRequest";

export const LoginForm = () => {
    const [formData, setFormData] = useState<LoginRequest>({
        tenant_id: import.meta.env.VITE_DEFAULT_TENANT_ID || "default_tenant",
        email: "",
        password: "",
    });

    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const result = await login(formData);
        if (result?.error) {
            setError(result.error);
        } else {
            navigate("/");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 max-w-md mx-auto">
            {/* Email */}
            <label className="input validator flex items-center gap-2">
                <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </g>
                </svg>
                <input
                    type="email"
                    name="email"
                    placeholder="correo@dominio.com"
                    required
                    className="grow"
                    onChange={handleChange}
                />
            </label>

            {/* Password */}
            <label className="input validator flex items-center gap-2">
                <span className="text-sm opacity-50">🔒</span>
                <input
                    type="password"
                    name="password"
                    placeholder="Contraseña"
                    required
                    className="grow"
                    onChange={handleChange}
                />
            </label>

            {/* Error */}
            {error && <div className="text-error text-sm">{error}</div>}

            {/* Button */}
            <button type="submit" className="btn btn-primary w-full">
                Entrar
            </button>

            <p className="text-sm text-center mt-4">
                ¿No tienes cuenta?{" "}
                <Link to="/register" className="font-semibold text-primary hover:underline">
                    Regístrate
                </Link>
            </p>
        </form>
    );
};
