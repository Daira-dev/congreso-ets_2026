'use client';

import React, { useState } from 'react';
import Swal from 'sweetalert2';

interface ManualDoc {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  desc: string;
  filename: string;
  url: string;
  size: string;
  pagesApprox: string;
  targetAudience: string;
  highlights: string[];
}

export default function AdminManualesView() {
  const [selectedManual, setSelectedManual] = useState<string | null>(null);

  const manuales: ManualDoc[] = [
    {
      id: 'usuario',
      title: 'Manual de Usuario y Operador',
      badge: 'Ilustrado · 24 Secciones',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
      desc: 'Guía paso a paso ilustrada para asistentes, operadores de acreditación en puerta y administradores. Incluye instructivos para el Diseñador Visual de Certificados, Constructor WYSIWYG de Encuestas, Editor de Temas, CMS Frontend (Hero, Secciones, Carrusel, FAQs Enriquecidas, Video Institucional y Avisos en Vivo Push), Gestión de Materiales (CRUD Anidado) y Purga Segura SHA-256.',
      filename: 'manual_usuario.html',
      url: '/manuales/manual_usuario.html',
      size: '~75 KB (HTML) / Ilustrado',
      pagesApprox: '24 Secciones',
      targetAudience: 'Asistentes, Operadores de Acreditación, Verificadores, Editores Web y Directores',
      highlights: [
        'Registro y Auto-gestión en el Portal Público',
        'Gafete Oficial con Código QR Criptográfico AES-256',
        'Operación de PWA Móvil Offline en Puertas y Anti-passback',
        'CMS Frontend: Hero WYSIWYG, Secciones, FAQs, Video Institucional y Avisos Push',
        'Gestión de Materiales: Arquitectura CRUD Anidado en 2 Niveles (Tarjetas e Ítems)',
        'Mantenimiento y Purga Segura con Fail-Safe SHA-256',
      ],
    },
    {
      id: 'tecnico',
      title: 'Manual de Arquitectura y Especificación Técnica',
      badge: 'Arquitectura & APIs · 19 Secciones',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      desc: 'Documentación técnica profunda sobre la arquitectura monorepo desacoplada, modelo relacional en 3FN, criptografía QR simétrica, catálogo de endpoints RESTful, motor CMS Frontend dinámico con JSONB (Hero, Secciones, Carrusel, FAQs, Video Institucional y Avisos Push), almacenamiento físico en imagenes_de_materiales/, controladores desacoplados y protocolo de purga con SHA-256.',
      filename: 'manual_tecnico.html',
      url: '/manuales/manual_tecnico.html',
      size: '~70 KB (HTML) / DDL 3FN',
      pagesApprox: '19 Secciones',
      targetAudience: 'Desarrolladores, Auditores de Sistemas, Administradores de BD y DevOps',
      highlights: [
        'Arquitectura Monorepo Desacoplado Next.js 14 + Express + PostgreSQL',
        'Modelo Relacional en Tercera Forma Normal (3FN)',
        'Criptografía QR AES-256-CBC con IV Dinámico y HMAC-SHA256',
        'Arquitectura CMS Frontend Dinámico con JSONB (Video, Avisos, FAQs, Hero y Secciones)',
        'Arquitectura de Materiales y Almacenamiento Físico en imagenes_de_materiales/',
        'Protocolo de Purga Segura y Firma Criptográfica SHA-256',
      ],
    },
    {
      id: 'operativo',
      title: 'Manual Operativo y de Administración IT',
      badge: 'Sistemas & IT · 17 Secciones',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      desc: 'Guía de despliegue nativo en Microsoft Windows 10/11 y Linux, administración de PostgreSQL, configuración de transporte Google SMTP, operación del CMS Frontend, estándares de resolución/DPI para Materiales y protocolo de respaldo pre-purga (Disaster Recovery).',
      filename: 'manual_operativo.html',
      url: '/manuales/manual_operativo.html',
      size: '~45 KB (HTML) / Procedimientos',
      pagesApprox: '17 Secciones',
      targetAudience: 'Personal de Infraestructura, Administradores de Servidor, Editores y Soporte Técnico',
      highlights: [
        'Instalador Automatizado Windows y Linux con Scripts de Mantenimiento',
        'Administración y Tuning del Servicio PostgreSQL 14/15/16',
        'Operación del CMS Frontend & Normas de Resolución/DPI para Materiales',
        'Protocolo de Respaldo Pre-Purga de Visitantes (Disaster Recovery)',
        'Conmutación en Caliente de Journaling (3 Niveles) y Mitigación Rate Limiting',
        'Generación y Restauración de Copias de Seguridad (SQL y ZIP)',
      ],
    },
    {
      id: 'diccionario',
      title: 'Diccionario de Datos Normalizado (3FN)',
      badge: 'PostgreSQL 16 · 23 Tablas',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      desc: 'Catálogo exhaustivo de 23 entidades, atributos, tipos de datos PostgreSQL, modificadores de nulabilidad, claves primarias, foráneas, restricciones de unicidad e índices para alta concurrencia, incluyendo la entidad materiales y las claves extendidas del CMS.',
      filename: 'diccionario_datos.html',
      url: '/manuales/diccionario_datos.html',
      size: '~55 KB (HTML) / 23 Entidades',
      pagesApprox: '6 Módulos',
      targetAudience: 'DBAs, Auditores de Seguridad, Ingenieros de Datos y Arquitectos de Software',
      highlights: [
        'Módulo 1: Identidad, Roles y Usuarios (Autenticación & RBAC)',
        'Módulo 2: Eventos, Sedes, Actividades y Entidad Materiales (Multimedia & Adjuntos)',
        'Módulo 3: Acreditaciones, Control en Puerta y Seguridad (PWA & QR)',
        'Módulo 4: Certificación Digital (Diplomas Vectoriales)',
        'Módulo 5: Encuestas de Calidad y Satisfacción (WYSIWYG)',
        'Módulo 6: Configuración del Sistema (Claves CMS, Push y Bitácora Forense)',
      ],
    },
    {
      id: 'seguridad',
      title: 'Informe Oficial de Certificación y Estado de Seguridad',
      badge: 'Status Actual · 100% Blindado',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      desc: 'Dictamen técnico oficial sobre el estado actual de ciberseguridad y robustez del sistema. Certifica la implementación activa de los 10 pilares de blindaje (RBAC Nivel 5, QR AES-256, anti-BOLA, autenticación de operadores, sanitización binaria y rate limiting) con 100% de cobertura en tests automatizados.',
      filename: 'informe_auditoria_seguridad.html',
      url: '/manuales/informe_auditoria_seguridad.html',
      size: '343 KB (PDF Oficial) / Certificación V2.0',
      pagesApprox: 'Certificación Oficial',
      targetAudience: 'Auditores de Seguridad, Directores de Sistemas, Administradores y Equipo DevOps',
      highlights: [
        'Pilar 1: Control de Acceso RBAC Granular (Niveles 1 a 5) y Aislamiento de Catálogos',
        'Pilar 2: Validación Criptográfica QR / OTP para Cancelación de Vacantes',
        'Pilar 3: Autenticación Fuerte de Operadores con JWT en Puestos de Puerta',
        'Pilar 4: Protección de Diplomas y Planillas de Asistencia en Sala',
        'Pilar 5 a 10: Secretos Seguros, Enmascaramiento SMTP, Bitácora Forense, CORS, Sanitización y Rate Limiting',
      ],
    },
  ];

  // Función para abrir la vista previa / documento oficial en una nueva pestaña (sin disparar impresión automática)
  const handleOpenPdfView = (manual: ManualDoc) => {
    const docWindow = window.open(manual.url, '_blank');
    if (docWindow) {
      docWindow.focus();
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Ventana Emergente Bloqueada',
        text: 'Por favor, habilite las ventanas emergentes en su navegador para visualizar y descargar el manual como PDF.',
        confirmButtonColor: '#0284c7',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-[98%] mx-auto py-2">
      {/* BANNER PRINCIPAL */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
              DETS · GCABA
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Documentación Oficial 2026
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Centro de Manuales y Documentación Oficial
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Consulte en línea los manuales técnicos, operativos y de usuario de la plataforma Congreso ETS 2026, o descárguelos formateados como documentos PDF listos para imprimir o archivar institucionalmente.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 sm:self-start md:self-center">
          <a
            href="/manuales/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow transition cursor-pointer"
            title="Abrir el portal interactivo de manuales en una pestaña completa"
          >
            <span>🌐</span>
            <span>Ver Portal Completo ↗</span>
          </a>
        </div>
      </div>

      {/* TARJETAS DE MANUALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {manuales.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-blue-400"
          >
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${doc.badgeColor}`}>
                  {doc.badge}
                </span>
                <span className="text-xs font-semibold text-gray-400">
                  {doc.pagesApprox}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-blue-700 transition">
                  {doc.title}
                </h3>
                <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                  {doc.desc}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Aspectos Clave:
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {doc.highlights.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 truncate">
                      <span className="text-blue-500 font-bold">•</span>
                      <span className="truncate">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-[11px] text-gray-500">
                <strong>Destinatarios:</strong> {doc.targetAudience}
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
              <button
                onClick={() => setSelectedManual(selectedManual === doc.id ? null : doc.id)}
                className="flex-1 py-2 px-3 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Ver o consultar manual directamente en este panel"
              >
                <span>{selectedManual === doc.id ? '✕ Ocultar' : '📖 Consultar'}</span>
              </button>

              <button
                onClick={() => handleOpenPdfView(doc)}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Abrir el manual en pestaña completa con botón para descargar/imprimir en PDF"
              >
                <span>📥</span>
                <span>Abrir / PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* VISOR EMBEBIDO INTEGRADO SI EL USUARIO DECIDE CONSULTAR UNO */}
      {selectedManual && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden transition-all duration-300">
          <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">●</span>
              <span className="text-sm font-bold">
                Visor Interactivo: {manuales.find((m) => m.id === selectedManual)?.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const iframe = document.getElementById('manual-iframe') as HTMLIFrameElement;
                  if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.print();
                  } else {
                    const m = manuales.find((item) => item.id === selectedManual);
                    if (m) handleOpenPdfView(m);
                  }
                }}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Imprimir o descargar como PDF"
              >
                <span>📥</span>
                <span>Imprimir / PDF</span>
              </button>
              <button
                onClick={() => setSelectedManual(null)}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded text-xs font-bold transition cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>
          </div>
          <div className="w-full h-[750px] bg-slate-100">
            <iframe
              id="manual-iframe"
              src={manuales.find((m) => m.id === selectedManual)?.url}
              className="w-full h-full border-none"
              title="Manual Interactivo"
            />
          </div>
        </div>
      )}

      {/* INSTRUCTIVO DE EXPORTACIÓN A PDF */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 text-xs sm:text-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="space-y-1">
          <div className="font-bold flex items-center gap-2">
            <span>💡</span>
            <span>¿Cómo guardar el manual como documento PDF en su dispositivo?</span>
          </div>
          <p className="text-amber-800 leading-relaxed text-xs">
            Al pulsar <strong>&ldquo;Descargar PDF&rdquo;</strong> se abrirá la vista con formato de impresión limpio (sin barras laterales ni menús flotantes). En el cuadro de diálogo de su navegador (Chrome, Edge, Firefox), seleccione en <em>Destino</em>: <strong>&ldquo;Guardar como PDF&rdquo;</strong>, tamaño de papel <strong>A4</strong> y haga clic en <strong>Guardar</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
