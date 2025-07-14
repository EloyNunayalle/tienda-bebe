export interface Usuario {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    direccion: string;
    user_id: string;
    tenant_id: string;
    rol: string;
    // Evitamos incluir el password por seguridad, aunque lo devuelve el backend pero hasheado
}

export interface UserResponse {
    usuario: Usuario;
}
