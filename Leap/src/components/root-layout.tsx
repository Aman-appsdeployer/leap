import { Outlet } from "react-router-dom";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

const RootLayout = () => {
    return (
        <>
            <Navbar />
            <div className="pt-24">
                <Outlet />
            </div>
            <Footer />
        </>
    );
};

export default RootLayout;
