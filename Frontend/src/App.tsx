import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./router/routes";
import './App.css';
import ScrollToTop from "./components/ScrollToTop.tsx";

function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <AppRoutes />
        </BrowserRouter>
    );
}

export default App;
