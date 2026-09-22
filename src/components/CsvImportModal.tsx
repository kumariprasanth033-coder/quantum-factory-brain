import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Check, 
  ArrowRight,
  Database,
  Layers,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { CsvImportType, CsvPreviewValidationResult, CsvImportCommitResult } from '../types';
import { getApiErrorMessage } from '../utils/errorParser';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (result: CsvImportCommitResult) => void;
  defaultType?: CsvImportType;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  defaultType = 'machines'
}) => {
  const [dataType, setDataType] = useState<CsvImportType>(defaultType);
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [previewData, setPreviewData] = useState<CsvPreviewValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [commitResult, setCommitResult] = useState<CsvImportCommitResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Sample CSV Templates for Download
  const downloadTemplate = () => {
    let headers = '';
    let sampleRow1 = '';
    let sampleRow2 = '';
    let filename = `${dataType}_template.csv`;

    if (dataType === 'machines') {
      headers = 'machine_code,machine_name,machine_type,status,capacity,location';
      sampleRow1 = 'M01,Precision 5-Axis CNC Mill,Milling,AVAILABLE,1,Bay 1 - Machining';
      sampleRow2 = 'M02,High-Speed CNC Lathe,Turning,AVAILABLE,1,Bay 1 - Machining';
    } else if (dataType === 'jobs') {
      headers = 'job_number,customer_name,product_name,quantity,priority,due_date';
      sampleRow1 = 'JOB-101,AeroDynamics Corp,Titanium Impeller Rotor,12,HIGH,2026-03-30T18:00:00';
      sampleRow2 = 'JOB-102,RoboTech Solutions,Actuator Servo Housing,25,MEDIUM,2026-04-05T12:00:00';
    } else if (dataType === 'operations') {
      headers = 'job_number,operation_number,operation_name,processing_time,sequence_number';
      sampleRow1 = 'JOB-101,OP-01,Rough CNC Milling,2.5,1';
      sampleRow2 = 'JOB-101,OP-02,Finish Surface Grinding,1.2,2';
    } else if (dataType === 'eligibility') {
      headers = 'job_number,operation_number,machine_code,processing_time';
      sampleRow1 = 'JOB-101,OP-01,M01,2.5';
      sampleRow2 = 'JOB-101,OP-01,M03,3.0';
    }

    const csvContent = `${headers}\n${sampleRow1}\n${sampleRow2}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileRead = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv') && selectedFile.type !== 'text/csv') {
      setErrorMessage('Please select a valid .csv file.');
      return;
    }
    setFile(selectedFile);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      setCsvRawText(content);
      // Run automatic preview validation
      runPreviewValidation(content, selectedFile.name);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the selected file.');
    };
    reader.readAsText(selectedFile);
  };

  const runPreviewValidation = async (content: string, filename: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const preview = await api.previewCsvImport({
        dataType,
        csvContent: content,
        filename
      });
      setPreviewData(preview);
      setStep('preview');
    } catch (err: any) {
      setErrorMessage(getApiErrorMessage(err) || 'Validation failed. Please verify CSV columns.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileRead(e.dataTransfer.files[0]);
    }
  };

  const handleCommit = async () => {
    if (!previewData || previewData.validRowsCount === 0) {
      setErrorMessage('No valid rows found to import.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const validRows = previewData.previewRows.filter(r => r.isValid);
      const result = await api.commitCsvImport({
        dataType,
        validRows
      });
      setCommitResult(result);
      setStep('success');
      onImportSuccess(result);
    } catch (err: any) {
      setErrorMessage(getApiErrorMessage(err) || 'Import failed: Transaction rolled back.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setCsvRawText('');
    setPreviewData(null);
    setCommitResult(null);
    setErrorMessage(null);
  };

  return (
    <div id="csv-import-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-[#0b1329] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#070d1e]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Upload className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Import Factory Data (CSV)</h2>
              <p className="text-xs text-slate-400">Validate schema, preview rows, and safely load factory assets</p>
            </div>
          </div>
          <button 
            id="close-csv-import-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-rose-400 flex-shrink-0" />
              <div>
                <p className="font-semibold">Import Issue Detected</p>
                <p className="mt-0.5 opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-6">
              {/* Data Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Select Import Target
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'machines', label: 'Machines', icon: Cpu, desc: 'Codes, types, capacities' },
                    { id: 'jobs', label: 'Jobs', icon: Layers, desc: 'Orders, products, priorities' },
                    { id: 'operations', label: 'Operations', icon: Database, desc: 'Job steps & durations' },
                    { id: 'eligibility', label: 'Eligibility', icon: CheckCircle2, desc: 'Machine capabilities' }
                  ].map((type) => {
                    const Icon = type.icon;
                    const isSelected = dataType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setDataType(type.id as CsvImportType);
                          setErrorMessage(null);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500/50 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold text-white">{type.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">{type.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Upload CSV File
                  </span>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {dataType} template</span>
                  </button>
                </div>

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                    dragActive
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-800 bg-[#070e24]/70 hover:border-slate-700 hover:bg-[#070e24]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileRead(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Drop your CSV file here, or <span className="text-cyan-400 underline">browse files</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Accepts standard comma-separated .csv with headers. Max recommended 2,000 rows.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && previewData && (
            <div className="space-y-4">
              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Rows</span>
                  <p className="text-lg font-bold text-white mt-0.5">{previewData.totalRows}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Ready to Import</span>
                  <p className="text-lg font-bold text-emerald-300 mt-0.5">{previewData.validRowsCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  <span className="text-[10px] uppercase font-bold text-rose-400">Errors (Skipped)</span>
                  <p className="text-lg font-bold text-rose-300 mt-0.5">{previewData.invalidRowsCount}</p>
                </div>
              </div>

              {/* Table Preview */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Validation Preview ({previewData.filename})
                </h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto bg-slate-950/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Row</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                        <th className="py-2.5 px-3 font-semibold">Data Preview</th>
                        <th className="py-2.5 px-3 font-semibold">Notes / Issues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {previewData.previewRows.map((row) => (
                        <tr key={row.rowNumber} className={row.isValid ? 'hover:bg-slate-900/40' : 'bg-rose-500/5 hover:bg-rose-500/10'}>
                          <td className="py-2 px-3 text-slate-400 font-mono">#{row.rowNumber}</td>
                          <td className="py-2 px-3">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                <Check className="w-3.5 h-3.5" /> Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                                <AlertTriangle className="w-3.5 h-3.5" /> Error
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-200 font-mono text-[11px] truncate max-w-xs">
                            {Object.entries(row.data).map(([k, v]) => `${k}:${v}`).join(' | ')}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-400">
                            {row.isValid ? (
                              <span className="text-slate-400">Ready to save</span>
                            ) : (
                              <span className="text-rose-400">{row.errors.join('; ')}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && commitResult && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Import Successfully Committed!</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                {commitResult.message} Live factory scheduling models and machine state have been refreshed.
              </p>
              <div className="inline-flex items-center gap-6 px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Imported Rows</span>
                  <p className="text-base font-bold text-cyan-400">{commitResult.importedCount}</p>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <span className="text-slate-400">Target Table</span>
                  <p className="text-base font-bold text-white uppercase">{commitResult.summary.dataType}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#070d1e]">
          {step === 'preview' ? (
            <button
              type="button"
              onClick={resetState}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Choose Different File
            </button>
          ) : (
            <span className="text-xs text-slate-500">Atomic commit with rollback safety</span>
          )}

          <div className="flex items-center gap-3">
            {step === 'success' ? (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-colors shadow-lg shadow-cyan-900/30"
              >
                Done
              </button>
            ) : step === 'preview' ? (
              <button
                type="button"
                disabled={isLoading || !previewData || previewData.validRowsCount === 0}
                onClick={handleCommit}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-colors disabled:opacity-50 shadow-lg shadow-cyan-900/30"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Committing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm & Import ({previewData?.validRowsCount || 0} Rows)</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
