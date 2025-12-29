
import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeEntry, CodeStatus, ViewMode, ScanResult } from './types';
import { dbService } from './services/db.ts';
import { generateBatchPDF } from './services/pdfService.ts';
import Scanner from './components/Scanner.tsx';
import ResultOverlay from './components/ResultOverlay.tsx';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [codes, setCodes] = useState<QRCodeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [filter, setFilter] = useState<'all' | CodeStatus>('all');

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    const all = await dbService.getAllCodes();
    setCodes(all.sort((a, b) => b.createdAt - a.createdAt));
  };

  const generateCodes = async () => {
    setIsLoading(true);
    const batchId = `BATCH-${Date.now()}`;
    const newBatch: QRCodeEntry[] = [];
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like I, 1, O, 0

    for (let i = 0; i < 100; i++) {
      let uniqueId = '';
      for (let j = 0; j < 10; j++) {
        uniqueId += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      newBatch.push({
        id: uniqueId,
        status: CodeStatus.UNUSED,
        createdAt: Date.now(),
        batchId
      });
    }

    try {
      await dbService.addCodes(newBatch);
      await loadCodes();
      alert('تم توليد 100 كود جديد بنجاح!');
    } catch (e) {
      alert('حدث خطأ أثناء التوليد. ربما توجد أكواد مكررة.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    const unusedCodes = codes.filter(c => c.status === CodeStatus.UNUSED);
    if (unusedCodes.length === 0) {
      alert('لا توجد أكواد غير مستخدمة للتصدير.');
      return;
    }
    
    // Use the most recent batch or just take the last 100 unused
    const batchToExport = unusedCodes.slice(0, 100);
    setIsLoading(true);
    await generateBatchPDF(batchToExport, `QR_Batch_${new Date().toISOString().split('T')[0]}`);
    setIsLoading(false);
  };

  const verifyCode = useCallback(async (code: string) => {
    const entry = await dbService.getCode(code.toUpperCase());
    
    if (!entry) {
      setScanResult({ code, status: 'invalid' });
    } else if (entry.status === CodeStatus.USED) {
      setScanResult({ code, status: 'already_used', timestamp: entry.usedAt });
    } else {
      await dbService.markAsUsed(code.toUpperCase());
      setScanResult({ code, status: 'valid' });
      loadCodes();
    }
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      verifyCode(manualInput.trim());
      setManualInput('');
    }
  };

  const filteredCodes = codes.filter(c => filter === 'all' || c.status === filter);

  const stats = {
    total: codes.length,
    unused: codes.filter(c => c.status === CodeStatus.UNUSED).length,
    used: codes.filter(c => c.status === CodeStatus.USED).length
  };

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto relative flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white p-6 rounded-b-[2rem] shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <i className="fa-solid fa-qrcode text-blue-400"></i>
            مدير QR
          </h1>
          <button 
            onClick={() => { if(confirm('هل أنت متأكد من مسح جميع البيانات؟')) { dbService.clearAll().then(() => loadCodes()); } }}
            className="text-gray-400 text-sm hover:text-red-400 transition-colors"
          >
            مسح البيانات
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 p-3 rounded-2xl text-center backdrop-blur-md">
            <div className="text-xl font-bold">{stats.total}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">الإجمالي</div>
          </div>
          <div className="bg-green-500/20 p-3 rounded-2xl text-center border border-green-500/30">
            <div className="text-xl font-bold text-green-400">{stats.unused}</div>
            <div className="text-[10px] text-green-400 uppercase tracking-wider">جاهز</div>
          </div>
          <div className="bg-amber-500/20 p-3 rounded-2xl text-center border border-amber-500/30">
            <div className="text-xl font-bold text-amber-400">{stats.used}</div>
            <div className="text-[10px] text-amber-400 uppercase tracking-wider">مستخدم</div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {view === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-plus text-blue-600 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold mb-2">توليد أكواد جديدة</h3>
              <p className="text-sm text-gray-500 mb-6">توليد دفعة من 100 كود فريد وغير مستخدم.</p>
              <button 
                onClick={generateCodes}
                disabled={isLoading}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {isLoading ? 'جاري التوليد...' : 'توليد 100 كود'}
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-file-pdf text-indigo-600 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold mb-2">تصدير للطباعة</h3>
              <p className="text-sm text-gray-500 mb-6">تحميل ملف PDF يحتوي على آخر 100 كود جاهز.</p>
              <button 
                onClick={handleExport}
                disabled={isLoading}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {isLoading ? 'جاري التجهيز...' : 'تصدير PDF'}
              </button>
            </div>
          </div>
        )}

        {view === 'manual' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <form onSubmit={handleManualSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-6 text-center">التحقق اليدوي</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">أدخل رمز الكود</label>
                  <input 
                    type="text" 
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="مثال: A1B2C3D4"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-center font-mono text-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    autoFocus
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-colors shadow-lg"
                >
                  تحقق من الكود
                </button>
              </div>
            </form>
          </div>
        )}

        {view === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 pb-8">
            <div className="flex bg-gray-100 p-1 rounded-2xl sticky top-0 z-10 backdrop-blur-md">
              <button 
                onClick={() => setFilter('all')} 
                className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${filter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
              >الكل</button>
              <button 
                onClick={() => setFilter(CodeStatus.UNUSED)} 
                className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${filter === CodeStatus.UNUSED ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}
              >جاهز</button>
              <button 
                onClick={() => setFilter(CodeStatus.USED)} 
                className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${filter === CodeStatus.USED ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500'}`}
              >مستخدم</button>
            </div>

            <div className="space-y-3">
              {filteredCodes.map(code => (
                <div key={code.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${code.status === CodeStatus.UNUSED ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    <div>
                      <div className="font-mono font-bold text-gray-800">{code.id}</div>
                      <div className="text-[10px] text-gray-400">
                        إنشاء: {new Date(code.createdAt).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                  </div>
                  {code.status === CodeStatus.USED && (
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-amber-600 uppercase">مستخدم في</div>
                      <div className="text-[11px] text-gray-500">
                        {new Date(code.usedAt!).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filteredCodes.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <i className="fa-solid fa-inbox text-4xl mb-3 block"></i>
                  لا توجد أكواد لعرضها
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 flex justify-around items-center max-w-md mx-auto z-40 rounded-t-3xl shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setView('dashboard')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <i className="fa-solid fa-house text-lg"></i>
          <span className="text-[10px] font-bold">الرئيسية</span>
        </button>
        <button 
          onClick={() => setView('manual')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'manual' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <i className="fa-solid fa-keyboard text-lg"></i>
          <span className="text-[10px] font-bold">يدوي</span>
        </button>
        
        {/* Floating Scan Button */}
        <button 
          onClick={() => setView('scan')}
          className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center -mt-10 shadow-lg shadow-blue-300 active:scale-90 transition-transform"
        >
          <i className="fa-solid fa-camera text-xl"></i>
        </button>

        <button 
          onClick={() => setView('history')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'history' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <i className="fa-solid fa-clock-rotate-left text-lg"></i>
          <span className="text-[10px] font-bold">السجل</span>
        </button>
        <div className="w-10"></div> {/* Spacer for symmetry */}
      </nav>

      {/* Overlays */}
      {view === 'scan' && (
        <Scanner 
          onScan={(text) => verifyCode(text)} 
          onClose={() => setView('dashboard')} 
        />
      )}

      {scanResult && (
        <ResultOverlay 
          result={scanResult} 
          onClose={() => {
            setScanResult(null);
            if(view === 'scan') setView('dashboard');
          }} 
        />
      )}
    </div>
  );
};

export default App;
