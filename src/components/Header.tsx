import React from 'react';
import { Volume2, VolumeX, Monitor, ShieldCheck, Bookmark, Compass, RefreshCw } from 'lucide-react';
import { sound } from '../utils/audio';

interface HeaderProps {
  crtEnabled: boolean;
  onToggleCrt: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSaveModal: () => void;
  onOpenMap: () => void;
  onRestartGame: () => void;
  currentDistrictName: string;
  isMapOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  crtEnabled,
  onToggleCrt,
  soundEnabled,
  onToggleSound,
  onOpenSaveModal,
  onOpenMap,
  onRestartGame,
  currentDistrictName,
  isMapOpen,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-cyan-900/40 px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]">
          異
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-wider text-slate-100 whitespace-nowrap glow-cyan">
            台灣異聞錄 · 島嶼漫遊者
          </h1>
          <p className="text-[11px] text-cyan-400/80 tracking-widest hidden sm:block">
            TAIWAN TALES: ISLAND RAMBLER // TRPG ENGINE
          </p>
        </div>
      </div>

      {/* Zone 2: Navigation & Quick Status */}
      <div className="hidden md:flex items-center gap-6 text-xs text-slate-300">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/60 rounded border border-slate-800">
          <span className="text-slate-500">當前地脈錨點:</span>
          <span className="text-amber-400 font-semibold">{currentDistrictName}</span>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            onOpenMap();
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded border transition-all whitespace-nowrap cursor-pointer ${
            isMapOpen
              ? 'bg-amber-950 text-amber-300 border-amber-500/70 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
              : 'text-cyan-400 hover:text-cyan-300 border-transparent hover:border-cyan-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>{isMapOpen ? '返回事件調查' : '靈能地圖'}</span>
        </button>
      </div>

      {/* Zone 3: Functional Utilities */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile Map Button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenMap();
          }}
          title={isMapOpen ? '返回事件調查' : '打開靈能地圖'}
          className={`md:hidden px-2.5 py-1.5 rounded text-xs flex items-center gap-1 transition-all cursor-pointer ${
            isMapOpen
              ? 'bg-amber-950 text-amber-300 border border-amber-500/60'
              : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{isMapOpen ? '返回' : '地圖'}</span>
        </button>
        {/* CRT Scanline Toggle */}
        <button
          onClick={() => {
            sound.playCrtSwitch();
            onToggleCrt();
          }}
          title={crtEnabled ? '關閉 CRT 螢幕濾鏡' : '開啟 CRT 復古濾鏡'}
          className={`px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            crtEnabled
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CRT</span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={() => {
            onToggleSound();
          }}
          title={soundEnabled ? '靜音' : '開啟音效'}
          className={`px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            soundEnabled
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
              : 'bg-slate-900 text-slate-500 border border-slate-800'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">音效</span>
        </button>

        {/* Save / Load modal button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenSaveModal();
          }}
          className="px-3 py-1.5 rounded text-xs flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>存讀檔</span>
        </button>

        {/* Restart Game */}
        <button
          onClick={() => {
            sound.playClick();
            if (window.confirm('確定要重新開始遊戲嗎？未保存的進度將會遺失。')) {
              onRestartGame();
            }
          }}
          title="重新開局"
          className="p-1.5 rounded text-xs text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
