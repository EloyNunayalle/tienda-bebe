import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
    return (
        <div className="min-h-screen bg-base-100 pt-16">
            <Navbar />
            <main className="p-4">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
