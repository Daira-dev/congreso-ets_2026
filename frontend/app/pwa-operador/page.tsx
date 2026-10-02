'use client';

import React from 'react';
import Link from 'next/link';
import { QRScannerView } from '@/components/QRScannerView';

export default function PwaOperadorPage() {
  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Cabecera PWA Operativa */}
      <header className="header-institutional text-white py-2 px-3 shadow-sm d-flex align-items-center justify-content-between sticky-top">
        <div className="d-flex align-items-center gap-2">
          <i className="bx bx-qr-scan fs-4 text-warning"></i>
          <div>
            <h1 className="h6 mb-0 fw-bold text-white">PWA Control de Accesos</h1>
            <small className="text-white-50" style={{ fontSize: '0.7rem' }}>
              Operador en Sede • Polo Saavedra
            </small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link
            href="/acreditacion"
            className="btn btn-sm btn-warning text-dark fw-bold d-flex align-items-center gap-1 shadow-sm"
          >
            <i className="bx bx-id-card"></i> Manual
          </Link>
          <Link
            href="/admin"
            className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
          >
            <i className="bx bx-shield-quarter"></i> Admin
          </Link>
        </div>
      </header>

      {/* Contenido Principal de Escaneo */}
      <main className="container-fluid p-2 p-md-3 flex-grow-1" style={{ maxWidth: '800px' }}>
        <div className="alert alert-primary d-flex align-items-center justify-content-between w-100 py-2 px-3 mb-3 shadow-sm">
          <div className="d-flex align-items-center gap-2 small">
            <i className="bx bx-info-circle fs-5"></i>
            <span>¿Cámara inaccesible o participante sin QR?</span>
          </div>
          <Link
            href="/acreditacion"
            className="btn btn-sm btn-dark text-white fw-bold d-flex align-items-center gap-1"
          >
            <i className="bx bx-user-check"></i> Buscar por DNI
          </Link>
        </div>
        <QRScannerView />
      </main>

      <footer className="py-2 text-center text-muted small bg-white border-top">
        PWA Operativa DETS • Sincronización automática con backend PostgreSQL
      </footer>
    </div>
  );
}
