import { Outlet } from "react-router";
import { AdminNavbar } from "../components/AdminNavbar";
import { Footer } from "../components/Footer";
import { AdminAuthProvider } from "../context/AdminAuthContext";
import AdminAuthGuard from "../components/AdminAuthGuard";

export const AdminLayout = () => {
  return (
    <AdminAuthProvider>
      <AdminAuthGuard>
        <div className="min-h-screen flex flex-col">
          <AdminNavbar />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </AdminAuthGuard>
    </AdminAuthProvider>
  );
};