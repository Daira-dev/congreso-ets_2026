"use client";
import { useState } from "react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

export default function RegistroPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    tipoDocumento: "DNI",
    numeroDocumento: "",
    correo: "",
    telefono: "",
    institucion: "",
    rolPrincipal: "",
    rolAdicional: "",
    intereses: "",
    aceptacion: false,
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "waitlist" | null; message: string }>({ type: null, message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.aceptacion) {
      setStatus({ type: "error", message: "Debes aceptar recibir comunicaciones para continuar." });
      return;
    }
    
    setLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setStatus({ type: "error", message: result.message || "Error al registrarse." });
      } else {
        if (result.estado === "CONFIRMADA") {
          setStatus({ type: "success", message: "¡Inscripción exitosa! Te hemos enviado un correo con tu código QR de acceso." });
        } else {
          setStatus({ type: "waitlist", message: "Tu registro fue incorporado a la lista de espera por haber alcanzado el cupo máximo. Te notificaremos por correo." });
        }
        setFormData({
          nombre: "", apellido: "", tipoDocumento: "DNI", numeroDocumento: "", correo: "",
          telefono: "", institucion: "", rolPrincipal: "", rolAdicional: "", intereses: "", aceptacion: false
        });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Ocurrió un error inesperado. Por favor, intenta nuevamente." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 flex flex-col">
      <title>Registro | Congreso ETS 2026</title>
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center flex-1 w-full">
        <div className="text-center mb-10">
          <h1 className="text-2xl text-[#1D3343] md:text-3xl font-extrabold mb-2">
            Inscripción de Asistentes
          </h1>
          <p className="text-[#035C80]">
            Completá el formulario para asegurar tu lugar. La participación es gratuita.
          </p>
        </div>

        {status.type && (
          <div className={`w-full p-4 mb-6 rounded-md font-bold text-center ${status.type === "error" ? "bg-red-100 text-red-700" : status.type === "success" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5 bg-gray-50 p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col">
              <label className="font-bold text-[#1D3343] mb-1">Nombre *</label>
              <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="border border-gray-300 p-2 rounded focus:outline-none focus:border-[#035C80]" />
            </div>
            <div className="flex flex-col">
              <label className="font-bold text-[#1D3343] mb-1">Apellido *</label>
              <input required type="text" name="apellido" value={formData.apellido} onChange={handleChange} className="border border-gray-300 p-2 rounded focus:outline-none focus:border-[#035C80]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col">
              <label className="font-bold text-[#1D3343] mb-1">Tipo de documento *</label>
              <select required name="tipoDocumento" value={formData.tipoDocumento} onChange={handleChange} className="border border-gray-300 p-2 rounded focus:outline-none focus:border-[#035C80] bg-white">
                <option value="DNI">DNI</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-bold text-[#1D3343] mb-1">Número de documento *</label>
              <input required type="text" name="numeroDocumento" value={formData.numeroDocumento} onChange={handleChange} className="border border-gray-300 p-2 rounded focus:outline-none focus:border-[#035C80]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col">
              <label className="font-bold text-[#1D3343] mb-1">Correo electrónico *</label>
              <input required type="email" name="correo" value={formData.correo} onChange={handleChange} className="border border-gray-300 p-2 rounded focus:outline-none focus:border-[#035C80]" />
            </div>
            <div className="flex flex-col">
              <label className="font-bold text-[#1D3343] mb-1">Teléfono *</label>
              <input required type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className="border border-gray-300 p-2 rounded focus:outline-none focus:border-[#035C80]" />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="font-bold text-[#1D3343] mb-1">Institución de pertenencia *</label>
            <input required type="text" name="institucion" value={formData.institucion} onChange={handleChange} className="border border-gray-300 p-2 rounded focus:outline-none focus:border-[#035C80]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col">
              <label className="font-bold text-[#1D3343] mb-1">Rol principal *</label>
              <select required name="rolPrincipal" value={formData.rolPrincipal} onChange={handleChange} className="border border-gray-300 p-2 rounded focus:outline-none focus:border-[#035C80] bg-white">
                <option value="">Selecciona un rol</option>
                <option value="Estudiante">Estudiante</option>
                <option value="Docente">Docente</option>
                <option value="Autoridad institucional">Autoridad institucional</option>
                <option value="Referente de Prácticas">Referente de Prácticas Profesionalizantes</option>
                <option value="Egresada/o">Egresada/o</option>
                <option value="Invitada/o">Invitada/o</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-bold text-[#1D3343] mb-1">Rol adicional (opcional)</label>
              <input type="text" name="rolAdicional" placeholder="Ej. Expositor" value={formData.rolAdicional} onChange={handleChange} className="border border-gray-300 p-2 rounded focus:outline-none focus:border-[#035C80]" />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="font-bold text-[#1D3343] mb-1">Intereses vinculados con el Congreso</label>
            <textarea name="intereses" value={formData.intereses} onChange={handleChange} className="border border-gray-300 p-2 rounded focus:outline-none focus:border-[#035C80] min-h-24 resize-y" placeholder="Contanos brevemente qué temáticas te interesan..."></textarea>
          </div>

          <div className="flex items-start gap-3 mt-4">
            <input required type="checkbox" id="aceptacion" name="aceptacion" checked={formData.aceptacion} onChange={handleChange} className="mt-1 w-5 h-5 accent-[#035C80]" />
            <label htmlFor="aceptacion" className="text-sm text-gray-700">
              Acepto recibir comunicaciones vinculadas con el 1er Congreso de Educación Técnica Superior – ETS 2026. *
            </label>
          </div>

          <button disabled={loading} type="submit" className="mt-6 bg-[#FFCD02] hover:bg-[#e5b800] text-[#1D3343] font-bold py-3 px-6 rounded transition-colors disabled:opacity-70 disabled:cursor-not-allowed mx-auto block min-w-[200px]">
            {loading ? "Procesando..." : "Inscribirme al Congreso"}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
