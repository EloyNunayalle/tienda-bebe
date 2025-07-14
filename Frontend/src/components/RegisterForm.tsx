import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RegisterRequest } from "../interfaces/auth/RegisterRequest";
import { register } from "../services/auth/register";

export const RegisterForm = () => {
    const [formData, setFormData] = useState<RegisterRequest>({
        tenant_id: import.meta.env.VITE_DEFAULT_TENANT_ID, // puedes hacerlo dinámico si lo deseas
        email: "",
        password: "",
        nombre: "",
        apellido: "",
        telefono: "",
        direccion: "",
    });

    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await register(formData);
            navigate("/login");
        } catch (error) {
            console.error("Error al registrar:", error);
            alert("Hubo un error al registrar. Inténtalo de nuevo.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
            {/* Nombre */}
            <label className="input validator flex items-center gap-2">
                <span className="text-sm opacity-50">👤</span>
                <input type="text" name="nombre" placeholder="Nombre" required className="grow" onChange={handleChange} />
            </label>

            {/* Apellido */}
            <label className="input validator flex items-center gap-2">
                <span className="text-sm opacity-50">👤</span>
                <input type="text" name="apellido" placeholder="Apellido" required className="grow" onChange={handleChange} />
            </label>

            {/* Correo */}
            <label className="input validator flex items-center gap-2">
                <span className="text-sm opacity-50">📧</span>
                <input type="email" name="email" placeholder="correo@dominio.com" required className="grow" onChange={handleChange} />
            </label>

            {/* Teléfono */}
            <label className="input validator flex items-center gap-2">
                <span className="text-sm opacity-50">📱</span>
                <input type="tel" name="telefono" placeholder="Teléfono" required minLength={9} maxLength={15} className="grow" onChange={handleChange} />
            </label>

            {/* Dirección */}
            <label className="input validator flex items-center gap-2">
                <span className="text-sm opacity-50">📍</span>
                <input type="text" name="direccion" placeholder="Dirección" required className="grow" onChange={handleChange} />
            </label>

            {/* Contraseña */}
            <label className="input validator flex items-center gap-2">
                <span className="text-sm opacity-50">🔒</span>
                <input type="password" name="password" placeholder="Contraseña" required minLength={6} className="grow" onChange={handleChange} />
            </label>

            {/* Botón */}
            <button type="submit" className="btn btn-primary w-full">
                Registrarse
            </button>
        </form>
    );
};
