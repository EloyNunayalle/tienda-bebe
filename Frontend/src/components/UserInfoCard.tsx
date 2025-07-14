import { useEffect, useState } from "react";
import { obtenerUser } from "../services/user/obtenerUser";
import { UserResponse } from "../interfaces/user/UserResponse";
import { useAuth } from "../contexts/AuthContext";

const UserInfoCard = () => {
    const { user } = useAuth();
    const [userInfo, setUserInfo] = useState<UserResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (user?.user_id && user?.tenant_id && user?.token) {
                const userResult = await obtenerUser(
                    {
                        tenant_id: user.tenant_id,
                        user_id: user.user_id,
                    },
                    user.token
                );

                if ("error" in userResult) {
                    setError(userResult.error);
                } else {
                    setUserInfo(userResult);
                }
            } else {
                setError("⚠️ Token o datos de usuario no disponibles");
            }
        };

        fetchData();
    }, [user]);

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (!userInfo) {
        return <div className="text-center py-10">Cargando información del usuario...</div>;
    }

    const { usuario } = userInfo;

    return (
        <div className="card w-full bg-base-200 shadow-md">
            <div className="card-body">
                <h2 className="card-title text-2xl">Perfil del usuario</h2>

                <div className="flex items-center gap-4 mt-4">
                    <div className="avatar">
                        <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                            <img
                                src="/images/usuario.jpg"
                                alt="Avatar de usuario"
                            />
                        </div>
                    </div>
                    <div>
                        <p className="font-semibold text-lg">{usuario.nombre} {usuario.apellido}</p>
                        <p className="text-sm text-base-content/70">{usuario.email}</p>
                    </div>
                </div>

                <div className="divider my-4">Información personal</div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Nombre: </span>{usuario.nombre}</div>
                    <div><span className="font-medium">Apellido: </span>{usuario.apellido}</div>
                    <div><span className="font-medium">Teléfono: </span>{usuario.telefono}</div>
                    <div><span className="font-medium">Rol: </span>{usuario.rol}</div>
                    <div className="col-span-2">
                        <span className="font-medium">Dirección: </span>{usuario.direccion || "-"}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserInfoCard;
