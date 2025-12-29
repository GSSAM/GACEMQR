
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(
      (decodedText) => {
        onScan(decodedText);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
        }
      },
      (error) => {
        // Silent error to avoid console spam
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner on unmount", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl relative">
        <div id="qr-reader" className="w-full"></div>
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center backdrop-blur-md"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      <p className="text-white mt-6 text-lg font-medium">وجه الكاميرا نحو كود QR</p>
    </div>
  );
};

export default Scanner;
