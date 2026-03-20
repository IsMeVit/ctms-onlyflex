"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Save, 
  LayoutGrid, 
  Settings2, 
  Info,
  Monitor,
  Building2,
  Rows,
  Columns,
  Loader2,
  Trash2,
  Plus
} from "lucide-react";
import { RowConfig, getRowLabel } from "@/lib/hall-utils";

interface Hall {
  id: string;
  name: string;
  hallType: string;
  screenType: string;
  capacity: number;
  rows: number;
  columns: number;
  isActive: boolean;
  rowConfigs?: RowConfig[];
}

interface HallFormData {
  name: string;
  hallType: string;
  screenType: string;
  rows: number;
  columns: number;
  isActive: boolean;
  rowConfigs: RowConfig[];
}

interface HallFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HallFormData) => void;
  hall?: Hall | null;
  isLoading: boolean;
}

const hallTypes = ["REGULAR", "PREMIUM", "VIP"];
const screenTypes = ["STANDARD_2D", "IMAX", "DOLBY_ATMOS", "GOLD_CLASS"];

const initialFormData: HallFormData = {
  name: "",
  hallType: "REGULAR",
  screenType: "STANDARD_2D",
  rows: 8,
  columns: 12,
  isActive: true,
  rowConfigs: [{ startRow: "A", endRow: "H", seatType: "REGULAR" }],
};

export default function HallForm({
  isOpen,
  onClose,
  onSubmit,
  hall,
  isLoading,
}: HallFormProps) {
  const [formData, setFormData] = useState<HallFormData>(initialFormData);

  useEffect(() => {
    if (isOpen) {
      if (hall) {
        setFormData({ // eslint-disable-line react-hooks/set-state-in-effect
          name: hall.name,
          hallType: hall.hallType,
          screenType: hall.screenType || "STANDARD_2D",
          rows: hall.rows,
          columns: hall.columns,
          isActive: hall.isActive,
          rowConfigs: hall.rowConfigs && hall.rowConfigs.length > 0
            ? hall.rowConfigs
            : [{ 
                startRow: "A", 
                endRow: getRowLabel((hall.rows || 8) - 1), 
                seatType: "REGULAR" as const 
              }],
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [hall, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : val,
    }));
  };

  const handleRowConfigChange = (index: number, field: keyof RowConfig, value: string) => {
    const newConfigs = [...formData.rowConfigs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setFormData({ ...formData, rowConfigs: newConfigs });
  };

  const addRowConfig = () => {
    setFormData({
      ...formData,
      rowConfigs: [...formData.rowConfigs, { startRow: "A", endRow: "A", seatType: "REGULAR" }],
    });
  };

  const removeRowConfig = (index: number) => {
    const newConfigs = formData.rowConfigs.filter((_, i) => i !== index);
    setFormData({ ...formData, rowConfigs: newConfigs });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-50 transition-colors">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {hall ? "Edit Hall Configuration" : "Create New Cinema Hall"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Define dimensions and seating types for the hall.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} 
          className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar"
        >
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Hall Name
              </label>
              <input 
                type="text" 
                name="name" 
                required 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="e.g. Cinema 01 - Grand IMAX" 
                className="w-full px-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5" /> Screen Type
              </label>
              <select 
                name="screenType" 
                value={formData.screenType} 
                onChange={handleChange} 
                className="w-full px-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium focus:border-red-500 outline-none dark:bg-[#09090b]"
              >
                {screenTypes.map(type => (
                  <option key={type} value={type}>{type.replace("_", " ")}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" /> Hall Category
              </label>
              <select 
                name="hallType" 
                value={formData.hallType} 
                onChange={handleChange} 
                className="w-full px-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium focus:border-red-500 outline-none dark:bg-[#09090b]"
              >
                {hallTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          {/* Grid Dimensions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <LayoutGrid className="w-4 h-4 text-zinc-400" />
               <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Dimensions</h4>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Rows className="w-3.5 h-3.5" /> Number of Rows
                </label>
                <input 
                  type="number" 
                  name="rows" 
                  min="1" 
                  max="26" 
                  value={formData.rows} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-red-500 outline-none transition-all" 
                />
                <p className="text-[10px] text-zinc-400">Rows will be labeled A to {getRowLabel(formData.rows - 1)}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Columns className="w-3.5 h-3.5" /> Columns per Row
                </label>
                <input 
                  type="number" 
                  name="columns" 
                  min="1" 
                  max="50" 
                  value={formData.columns} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-red-500 outline-none transition-all" 
                />
                <p className="text-[10px] text-zinc-400">Total capacity: {formData.rows * formData.columns} seats</p>
              </div>
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          {/* Row Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Settings2 className="w-4 h-4 text-zinc-400" />
                 <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Seat Types by Row</h4>
              </div>
              <button 
                type="button" 
                onClick={addRowConfig}
                className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Range
              </button>
            </div>

            <div className="space-y-3">
              {formData.rowConfigs.map((config, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 p-4 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 rounded-xl"
                >
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">From Row</label>
                      <input 
                        type="text" 
                        value={config.startRow} 
                        onChange={(e) => handleRowConfigChange(index, "startRow", e.target.value.toUpperCase())}
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-center font-bold"
                        maxLength={1}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">To Row</label>
                      <input 
                        type="text" 
                        value={config.endRow} 
                        onChange={(e) => handleRowConfigChange(index, "endRow", e.target.value.toUpperCase())}
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-center font-bold"
                        maxLength={1}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Seat Type</label>
                      <select 
                        value={config.seatType} 
                        onChange={(e) => handleRowConfigChange(index, "seatType", e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold"
                      >
                        <option value="REGULAR">REGULAR</option>
                        <option value="VIP">VIP</option>
                        <option value="TWINSEAT">TWINSEAT</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeRowConfig(index)}
                    disabled={formData.rowConfigs.length === 1}
                    className="mt-4 p-2 text-zinc-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl flex gap-3">
               <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
               <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
                 You can define which rows have special seat types. Any rows not covered in these ranges will default to REGULAR.
               </p>
            </div>
          </div>

          {/* Hall Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
             <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Active Status</p>
                <p className="text-xs text-zinc-500">Enable or disable this hall for new showtimes.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="isActive" 
                  checked={formData.isActive} 
                  onChange={handleChange} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
             </label>
          </div>

          {/* Form Footer Actions */}
          <div className="flex justify-end gap-4 pt-8 border-t border-zinc-100 dark:border-zinc-800 items-center">
             <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Discard</button>
             <button 
              type="submit" 
              disabled={isLoading} 
              className="px-8 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isLoading ? "Saving..." : hall ? "Update Hall" : "Create Hall"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
