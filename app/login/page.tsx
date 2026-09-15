import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

export const metadata = {
    title: "Iniciar sesión | DETS 2026",
};

const Login = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header />
            
            <main className="flex-grow flex items-center justify-center px-4 py-12 pt-28">
                <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
                    <div className="flex flex-col items-center mb-8">
                        <h2 className="text-2xl font-bold text-azul-oscuro mt-2">Acceso Administrativo</h2>
                        <p className="text-gray-500 text-sm mt-2 text-center">
                            Ingrese sus credenciales para acceder al panel de gestión del congreso.
                        </p>
                    </div>
                    
                    <form className="flex flex-col gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="usuario">
                                Usuario
                            </label>
                            <input 
                                id="usuario" 
                                type="text" 
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                                placeholder="Ingrese su usuario"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="clave">
                                Clave
                            </label>
                            <input 
                                id="clave" 
                                type="password" 
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                                placeholder="Ingrese su clave"
                            />
                        </div>
                        
                        <button 
                            type="button" 
                            className="mt-2 w-full bg-azul-oscuro text-white font-bold py-3 px-4 rounded shadow hover:bg-black hover:shadow-md transition-all cursor-pointer"
                        >
                            Ingresar
                        </button>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default Login