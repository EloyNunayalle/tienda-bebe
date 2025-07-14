import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { login as loginService } from "../services/auth/login";
import { LoginRequest } from "../interfaces/auth/LoginRequest";
import { LoginError } from "../interfaces/auth/LoginError";
import { AuthResponse } from "../interfaces/auth/AuthResponse";

interface AuthContextType {
    isAuthenticated: boolean;
    user: AuthResponse | null;
    login: (credentials: LoginRequest) => Promise<LoginError | null>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthResponse | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("auth");
        if (stored) {
            setUser(JSON.parse(stored));
        }
    }, []);

    const login = async (credentials: LoginRequest): Promise<LoginError | null> => {
        const result = await loginService(credentials);

        if ("error" in result) {
            return { error: result.error };
        }

        localStorage.setItem("auth", JSON.stringify(result));
        setUser(result);
        return null;
    };

    const logout = () => {
        localStorage.removeItem("auth");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: !!user,
                user,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth debe estar dentro de <AuthProvider>");
    return context;
};
