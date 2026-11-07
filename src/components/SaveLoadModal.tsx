import React, { useState, useEffect, useRef } from 'react';
import { PlayerCharacter, SaveSlotData } from '../types/game';
import { generateChecksum, verifyChecksum } from '../utils/crypto';
import { sound } from '../utils/audio';
import { X, Save, Upload, Download, Trash2, ShieldCheck, AlertTriangle, Clock } from 'lucide-react';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerCharacter;
  onLoadPlayer: (loadedPlayer: PlayerCharacter) => void;
}

const STORAGE_PREFIX = 'TW_ISLAND_RAMBLER_SLOT_';

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  isOpen,
  onClose,
  player,
  onLoadPlayer,
}) => {
  const [slots, setSlots] = useState<{ [key: number]: SaveSlotData | null }>({
    0: null, // Autosave
    1: null,
    2: null,
    3: null,
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSlotsFromStorage = () => {
    const loaded: { [key: number]: SaveSlotData | null } = { 0: null, 1: null, 2: null, 3: null };
    for (let i = 0; i <= 3; i++) {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${i}`);
      if (raw) {
        try {
          loaded[i] = JSON.parse(raw);
        } catch {
          loaded[i] = null;
        }
      }
    }
    setSlots(loaded);
  };

  useEffect(() => {
    if (isOpen) {
      loadSlotsFromStorage();
      setNotification(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveToSlot = async (slotNum: number) => {
    try {
      const checksum = await generateChecksum(player);
      const data: SaveSlotData = {
        slot: slotNum,
        timestamp: new Date().toLocaleString('zh-TW', { hour12: false }),
        player,
        checksum,
        isAutosave: slotNum === 0,
      };
      localStorage.setItem(`${STORAGE_PREFIX}${slotNum}`, JSON.stringify(data));
      loadSlotsFromStorage();
      sound.playSuccess();
      notify(`已成功保存進度至【${slotNum === 0 ? '自動存檔' : `存檔 Slot ${slotNum}`}】！SHA-256 數位簽章已生成。`);
    } catch {
      notify('存檔失敗，請確認瀏覽器儲存空間。', 'error');
    }
  };

  const handleLoadFromSlot = async (slotNum: number) => {
    const slotData = slots[slotNum];
    if (!slotData) return;

    sound.playClick();
    // Validate SHA-256 Checksum
    const isValid = await verifyChecksum(slotData.player, slotData.checksum);
    if (!isValid) {
      sound.playFailure();
      const proceed = window.confirm(
        '⚠️ 警告：存檔資料之 SHA-256 雜湊檢查碼不符合！\n可能曾在開發者工具或外部被篡改。\n是否仍要強制載入此存檔？'
      );
      if (!proceed) return;
    }

    onLoadPlayer(slotData.player);
    sound.playSuccess();
    notify(`已成功載入【${slotNum === 0 ? '自動存檔' : `存檔 Slot ${slotNum}`}】進度！`);
    setTimeout(onClose, 600);
  };

  const handleDeleteSlot = (slotNum: number) => {
    sound.playClick();
    if (window.confirm(`確定要清除【${slotNum === 0 ? '自動存檔' : `存檔 Slot ${slotNum}`}】嗎？`)) {
      localStorage.removeItem(`${STORAGE_PREFIX}${slotNum}`);
      loadSlotsFromStorage();
      notify(`已清除 Slot ${slotNum} 的存檔資料。`);
    }
  };

  // Export JSON file
  const handleExportJSON = async (slotNum: number) => {
    const slotData = slots[slotNum];
    if (!slotData) return;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(slotData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `TaiwanRambler_Save_Slot${slotNum}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    sound.playSuccess();
    notify(`Slot ${slotNum} 存檔已匯出為 JSON 備份檔！`);
  };

  // Import JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text) as SaveSlotData;

        if (!parsed.player || !parsed.checksum) {
          notify('無效的存檔格式，缺少必要數據或檢查碼。', 'error');
          return;
        }

        const isValid = await verifyChecksum(parsed.player, parsed.checksum);
        if (!isValid) {
          notify('警告：此備份檔的 SHA-256 簽署驗證未通過，資料可能已遭人為竄改！', 'error');
        }

        // Save into Slot 1
        const targetSlot = 1;
        parsed.slot = targetSlot;
        parsed.timestamp = new Date().toLocaleString('zh-TW', { hour12: false }) + ' (匯入備份)';
        localStorage.setItem(`${STORAGE_PREFIX}${targetSlot}`, JSON.stringify(parsed));
        loadSlotsFromStorage();
        sound.playSuccess();
        notify(`備份檔案已成功匯入至【存檔 Slot 1】！`, isValid ? 'success' : 'error');
      } catch {
        notify('解析 JSON 檔案時發生錯誤。', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0b101c] border border-cyan-800/50 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>雙重存檔與防篡改安全性系統 (SAVE & SECURITY)</span>
            </h2>
            <p className="text-xs text-slate-400">
              支援 LocalStorage 本地 3 槽手動存檔、1 槽自動備份，以及 JSON 跨裝置匯出/匯入。
            </p>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                : 'bg-rose-950/80 border border-rose-500/60 text-rose-300'
            }`}
          >
            {notification.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{notification.msg}</span>
          </div>
        )}

        {/* Slots List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {[0, 1, 2, 3].map((slotNum) => {
            const data = slots[slotNum];
            const isAuto = slotNum === 0;

            return (
              <div
                key={slotNum}
                className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-200">
                      {isAuto ? '⚡ 自動存檔 (Autosave)' : `💾 手動存檔 Slot ${slotNum}`}
                    </span>
                    {data && (
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-cyan-400" />
                        SHA-256 簽署完成
                      </span>
                    )}
                  </div>

                  {data ? (
                    <div className="space-y-0.5 text-slate-400">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{data.timestamp}</span>
                      </div>
                      <div className="text-slate-300 font-mono text-[11px]">
                        漫遊者: <span className="text-cyan-300">{data.player.name}</span> ({data.player.archetype}) · 等級 Lv.{data.player.vitals.lv}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        HP {data.player.vitals.hp}/{data.player.vitals.maxHp} · SAN {data.player.vitals.san}/{data.player.vitals.maxSan} · ${data.player.vitals.twd}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-600 italic">尚無存檔資料</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isAuto && (
                    <button
                      onClick={() => handleSaveToSlot(slotNum)}
                      className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-600/50 text-cyan-300 font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>覆寫存檔</span>
                    </button>
                  )}

                  {data && (
                    <>
                      <button
                        onClick={() => handleLoadFromSlot(slotNum)}
                        className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 font-bold rounded transition-colors cursor-pointer"
                      >
                        載入存檔
                      </button>

                      <button
                        onClick={() => handleExportJSON(slotNum)}
                        title="匯出為 JSON 備份檔"
                        className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-300 rounded transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteSlot(slotNum)}
                        title="清除此存檔"
                        className="p-1.5 bg-slate-950 border border-slate-800 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* JSON Import Section */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            支援將本機 .json 存檔檔案匯入至 Slot 1。
          </div>
          <div>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 rounded-lg text-slate-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>匯入 JSON 備份檔案</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
