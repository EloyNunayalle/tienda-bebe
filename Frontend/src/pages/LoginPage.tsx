import { LoginForm } from "../components/LoginForm";

const LoginPage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-base-100 px-4 ">
            <h1 className="text-3xl font-bold text-center mb-6">Iniciar sesión</h1>
            <LoginForm />
        </div>
    );
};

export default LoginPage;
