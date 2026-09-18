"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

const Login = () => {
    const [usuario, setUsuario] = useState("");
    const [clave, setClave] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario, clave }),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Error al iniciar sesión.");
            } else {
                router.push("/admin");
            }
        } catch (err) {
            setError("Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <title>Iniciar sesión | DETS 2026</title>
            <Header />
            
            <main className="flex-grow flex items-center justify-center px-4 py-12 pt-28">
                <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
                    <div className="flex flex-col items-center mb-8">
                        <h2 className="text-2xl font-bold text-[#1D3343] mt-2">Acceso Administrativo</h2>
                        <p className="text-gray-500 text-sm mt-2 text-center">
                            Ingrese sus credenciales para acceder al panel de gestión del congreso.
                        </p>
                    </div>
                    
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded text-center font-bold">
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-[#1D3343] mb-1.5" htmlFor="usuario">
                                Usuario
                            </label>
                            <input 
                                id="usuario" 
                                type="text" 
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFCD02] focus:border-transparent transition-all"
                                placeholder="Ingrese su usuario"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-[#1D3343] mb-1.5" htmlFor="clave">
                                Clave
                            </label>
                            <input 
                                id="clave" 
                                type="password" 
                                value={clave}
                                onChange={(e) => setClave(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFCD02] focus:border-transparent transition-all"
                                placeholder="Ingrese su clave"
                                required
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="mt-2 w-full bg-[#1D3343] text-white font-bold py-3 px-4 rounded shadow hover:bg-[#035C80] hover:shadow-md transition-all cursor-pointer disabled:opacity-70"
                        >
                            {loading ? "Ingresando..." : "Ingresar"}
                        </button>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default Login;