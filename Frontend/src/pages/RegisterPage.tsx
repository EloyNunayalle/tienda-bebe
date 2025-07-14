import { RegisterForm } from "../components/RegisterForm";

const RegisterPage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-base-100 px-4 ">
            <h1 className="text-3xl font-bold text-center mb-6">Registro</h1>
            <RegisterForm />
        </div>
    );
};

export default RegisterPage;
