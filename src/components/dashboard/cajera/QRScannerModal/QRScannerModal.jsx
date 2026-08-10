'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScannerModal.css';

const SCANNER_ELEMENT_ID = 'qr-scanner-region';

// Modal con acceso a la cámara del celular para leer el QR del boleto.
// Se implementa aparte del <Modal> genérico porque html5-qrcode necesita
// control fino sobre cuándo se monta/desmonta el <div> del video.
const QRScannerModal = ({ isOpen, onClose, onScan }) => {
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;

    let isActive = true;
    setError('');
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          if (!isActive) return;
          isActive = false;
          onScan(decodedText);
        },
        () => {
          // Se llama muy seguido mientras no encuentra QR en el frame; se ignora.
        }
      )
      .catch((err) => {
        console.error('Error iniciando cámara:', err);
        setError('No se pudo acceder a la cámara. Revisa los permisos del navegador.');
      });

    return () => {
      isActive = false;
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, [isOpen, onScan]);

  if (!isOpen) return null;

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <h4>Escanear Código QR</h4>
          <button onClick={onClose} aria-label="Cerrar">&times;</button>
        </div>
        <div id={SCANNER_ELEMENT_ID} className="qr-scanner-region" />
        {error && <p className="qr-error">{error}</p>}
        <p className="qr-hint">Apunta la cámara al código QR del boleto del cliente.</p>
      </div>
    </div>
  );
};

export default QRScannerModal;
