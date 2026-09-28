import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileDown, 
  Printer, 
  Trash2, 
  Search, 
  Copy, 
  Check, 
  Calculator, 
  Atom, 
  FlaskConical, 
  CircleDollarSign, 
  Sparkles,
  Calendar,
  CheckCircle2,
  Filter,
  RefreshCw,
  Clock,
  Layers
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../FirebaseProvider';
import { fetchCalculations, deleteSingleCalculation, clearAllCalculations, CalculationRecord } from '../firebase';

interface CalculationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: any;
}

export function CalculationHistoryModal({ isOpen, onClose, currentTheme }: CalculationHistoryModalProps) {
  const { user, profile } = useAuth();
  const [historyList, setHistoryList] = useState<CalculationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Load history whenever modal opens
  const loadHistory = async () => {
    setLoading(true);
    try {
      const records = await fetchCalculations(user?.uid);
      setHistoryList(records);
    } catch (e) {
      console.warn('Failed to load calculations history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setConfirmClear(false);
    }
  }, [isOpen, user?.uid]);

  // Filter and search
  const filteredRecords = useMemo(() => {
    return historyList.filter((item) => {
      const matchesFilter = selectedModeFilter === 'all' || item.mode.toLowerCase() === selectedModeFilter.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.expression.toLowerCase().includes(q) || 
        item.result.toLowerCase().includes(q) ||
        item.mode.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [historyList, selectedModeFilter, searchQuery]);

  // Copy single calculation
  const handleCopy = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Delete single item
  const handleDeleteItem = async (id: string) => {
    await deleteSingleCalculation(user?.uid, id);
    setHistoryList(prev => prev.filter(item => item.id !== id));
  };

  // Clear all
  const handleClearAll = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3500);
      return;
    }
    if (user?.uid) {
      await clearAllCalculations(user.uid);
    } else {
      localStorage.removeItem('mahraj_calc_history');
    }
    setHistoryList([]);
    setConfirmClear(false);
  };

  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Export Formatted PDF Function
  const exportPDF = (shouldPrint: boolean = false) => {
    if (filteredRecords.length === 0) {
      setExportMessage('No calculation records available to export.');
      setTimeout(() => setExportMessage(null), 3000);
      return;
    }

    setIsExporting(true);
    setExportMessage(null);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor = [15, 23, 42]; // Slate 900
      const accentColor = [6, 182, 212]; // Cyan 500
      const dateStr = new Date().toLocaleString();
      const userName = profile?.displayName || user?.displayName || 'Scholar User';
      const userEmail = profile?.email || user?.email || 'Guest Scholar';

      // 1. Header Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 38, 'F');

      // Decorative Accent Line
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(0, 38, 210, 2, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('MAHRAJ CALCULAS - SCIENTIFIC RECORD', 14, 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(203, 213, 225); // Slate 300
      doc.text('Official Computational History & Mathematical Audit Log', 14, 23);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(`Generated: ${dateStr} | Total Records: ${filteredRecords.length}`, 14, 30);

      // 2. Scholar Details Box
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.roundedRect(14, 46, 182, 22, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 46, 182, 22, 3, 3, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('SCHOLAR IDENTITY:', 18, 53);
      doc.text('ACCOUNT / EMAIL:', 105, 53);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(userName, 18, 60);
      doc.text(userEmail, 105, 60);

      // 3. Calculation Table
      const tableData = filteredRecords.map((item, index) => {
        let formattedDate = 'Recent';
        if (item.createdAt) {
          try {
            formattedDate = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
              ' (' + new Date(item.createdAt).toLocaleDateString() + ')';
          } catch (_) {}
        }

        return [
          String(index + 1),
          formattedDate,
          (item.mode || 'MATH').toUpperCase(),
          item.expression || '-',
          item.result || '-'
        ];
      });

      autoTable(doc, {
        startY: 74,
        head: [['#', 'Timestamp', 'Category', 'Formula / Equation', 'Calculated Result']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 3.5
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 38, fontSize: 8 },
          2: { cellWidth: 26, fontStyle: 'bold', fontSize: 8 },
          3: { cellWidth: 58, font: 'courier', fontStyle: 'bold', fontSize: 8.5 },
          4: { cellWidth: 50, font: 'courier', fontStyle: 'bold', textColor: [13, 148, 136], fontSize: 9 }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [226, 232, 240],
          lineWidth: 0.2
        },
        didDrawPage: (data: any) => {
          // Page Footer
          const pageCount = (doc as any).internal.getNumberOfPages();
          const pageCurrent = data.pageNumber;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(
            'Confidential & Verified by Mahraj Calculas Mathematical Engine',
            14,
            290
          );
          doc.text(
            `Page ${pageCurrent} of ${pageCount}`,
            196,
            290,
            { align: 'right' }
          );
        }
      });

      if (shouldPrint) {
        doc.autoPrint();
        doc.save(`Mahraj_Calculas_Print_${new Date().toISOString().slice(0, 10)}.pdf`);
        setExportMessage('PDF ready for printing and saved to your device.');
        setTimeout(() => setExportMessage(null), 3500);
      } else {
        const fileName = `Mahraj_Calculas_Logs_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
        setExportMessage('PDF calculation logs downloaded successfully!');
        setTimeout(() => setExportMessage(null), 3500);
      }
    } catch (err) {
      console.error('PDF export error:', err);
      setExportMessage('Failed to generate PDF. Please try again.');
      setTimeout(() => setExportMessage(null), 3500);
    } finally {
      setIsExporting(false);
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'physics':
        return <Atom size={13} className="text-cyan-400" />;
      case 'chemistry':
        return <FlaskConical size={13} className="text-amber-400" />;
      case 'currency':
        return <CircleDollarSign size={13} className="text-emerald-400" />;
      default:
        return <Calculator size={13} className="text-lime-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="absolute inset-0 z-50 bg-[#07080c] flex flex-col justify-between overflow-hidden"
        >
          {/* Header Bar */}
          <div className="px-4 py-3.5 flex justify-between items-center bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-900 shrink-0">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-xl ${currentTheme.bgMuted} ${currentTheme.text}`}>
                <Clock size={16} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm leading-none flex items-center gap-1.5">
                  Calculation History Logs
                </h3>
                <span className="text-[10px] text-zinc-400 mt-0.5 block">
                  {historyList.length} records synced
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Refresh */}
              <button
                onClick={loadHistory}
                disabled={loading}
                className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 hover:text-white flex items-center justify-center text-zinc-400 transition-colors"
                title="Refresh history"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
              </button>

              {/* Close */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 hover:text-white flex items-center justify-center text-zinc-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Export Toast Notification */}
          <AnimatePresence>
            {exportMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 py-2 bg-cyan-950/90 border-b border-cyan-500/40 text-cyan-200 text-xs text-center font-medium shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={14} className="text-cyan-400" />
                <span>{exportMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Bar (PDF Export, Print, Search, and Filters) */}
          <div className="p-3 bg-zinc-950/60 border-b border-zinc-900 space-y-2.5 shrink-0">
            {/* Export Actions Ribbon */}
            <div className="flex items-center gap-2">
              {/* Export PDF Button */}
              <button
                onClick={() => exportPDF(false)}
                disabled={isExporting || filteredRecords.length === 0}
                className="flex-1 h-9 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download calculation logs as formatted PDF document"
              >
                <FileDown size={14} strokeWidth={2.5} />
                <span>{isExporting ? 'Generating PDF...' : 'Export as PDF'}</span>
              </button>

              {/* Print Document Button */}
              <button
                onClick={() => exportPDF(true)}
                disabled={isExporting || filteredRecords.length === 0}
                className="h-9 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-medium text-xs flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                title="Print PDF document"
              >
                <Printer size={14} />
                <span>Print</span>
              </button>

              {/* Clear History Button */}
              {historyList.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className={`h-9 px-2.5 rounded-xl border font-medium text-xs flex items-center gap-1 transition-all ${
                    confirmClear 
                      ? 'bg-red-600 text-white border-red-500 animate-pulse' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/30'
                  }`}
                  title="Clear all calculation records"
                >
                  <Trash2 size={13} />
                  <span>{confirmClear ? 'Confirm?' : 'Clear'}</span>
                </button>
              )}
            </div>

            {/* Search and Category Filter Chips */}
            <div className="flex items-center gap-2">
              {/* Search input */}
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search formula, result..."
                  className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Mode Filters */}
              <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {['all', 'math', 'physics', 'chemistry', 'currency'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedModeFilter(m)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all shrink-0 ${
                      selectedModeFilter === m
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* History Records Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-gradient-to-b from-[#07080c] to-black">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-500 text-xs">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Loading calculations...</span>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
                  <Calculator size={24} />
                </div>
                <h4 className="text-sm font-bold text-zinc-300 mb-1">No Calculations Found</h4>
                <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                  {searchQuery 
                    ? 'No matching calculations found for your search query.' 
                    : 'Your completed calculations and scientific formulas will automatically appear here with full PDF export support.'}
                </p>
              </div>
            ) : (
              filteredRecords.map((item, idx) => (
                <div
                  key={item.id ? `${item.id}-${idx}` : `calc-record-${idx}`}
                  className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-850/80 hover:border-zinc-700 transition-all shadow-md flex flex-col gap-2 group"
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-lg bg-zinc-900 border border-zinc-800">
                        {getModeIcon(item.mode)}
                      </span>
                      <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-400">
                        {item.mode || 'MATH'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-zinc-600 font-mono">
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      {/* Copy */}
                      <button
                        onClick={() => handleCopy(item.id, `${item.expression} = ${item.result}`)}
                        className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                        title="Copy calculation"
                      >
                        {copiedId === item.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-red-950/40 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors"
                        title="Delete log"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Expression & Result */}
                  <div className="bg-zinc-900/60 rounded-xl p-2.5 border border-zinc-850/60 space-y-1">
                    <div className="text-[11px] font-mono text-zinc-400 overflow-x-auto whitespace-nowrap custom-scrollbar">
                      {item.expression}
                    </div>
                    <div className="text-sm font-mono font-bold text-emerald-400 overflow-x-auto whitespace-nowrap custom-scrollbar flex items-center gap-1.5">
                      <span className="text-zinc-500 font-sans text-xs font-normal">=</span>
                      <span>{item.result}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer PDF Export Banner */}
          <div className="p-3 bg-zinc-950 border-t border-zinc-900 shrink-0 flex items-center justify-between text-xs text-zinc-400">
            <span className="text-[11px]">
              Showing <strong className="text-white">{filteredRecords.length}</strong> of {historyList.length} logs
            </span>
            <button
              onClick={() => exportPDF(false)}
              disabled={isExporting || filteredRecords.length === 0}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-cyan-500 text-cyan-300 font-semibold text-[11px] flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <FileDown size={12} />
              <span>Download PDF</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
