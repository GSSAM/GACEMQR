
import React from 'react';
import { ScanResult } from '../types';

interface ResultOverlayProps {
  result: ScanResult;
  onClose: () => void;
}

const ResultOverlay: React.FC<ResultOverlayProps> = ({ result, onClose }) => {
  const config = {
    valid: {
      icon: 'fa-circle-check',
      color: 'bg-green-500',
      title: 'تم القبول بنجاح',
      message: `الكود ${result.code} صالح وتم استخدامه الآن.`,
    },
    already_used: {
      icon: 'fa-circle-exclamation',
      color: 'bg-amber-500',
      title: 'مستخدم مسبقاً',
      message: `عذراً، هذا الكود تم استخدامه في: ${new Date(result.timestamp || 0).toLocaleString('ar-EG')}`,
    },
    invalid: {
      icon: 'fa-circle-xmark',
      color: 'bg-red-500',
      title: 'كود غير صالح',
      message: 'هذا الكود غير موجود في قاعدة البيانات.',
    }
  }[result.status];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col items-center p-8 text-center animate-in zoom-in-95 duration-300">
        <div className={`${config.color} text-white w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6 shadow-lg`}>
          <i className={`fa-solid ${config.icon}`}></i>
        </div>
        <h2 className="text-2xl font-bold mb-3">{config.title}</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">{config.message}</p>
        <button 
          onClick={onClose}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors shadow-md"
        >
          موافق
        </button>
      </div>
    </div>
  );
};

export default ResultOverlay;
