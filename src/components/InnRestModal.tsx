import React from 'react';
import { District, PlayerCharacter } from '../types/game';
import { sound } from '../utils/audio';
import { X, Bed, Moon, Coffee, Heart, Brain, Zap } from 'lucide-react';

interface InnRestModalProps {
  isOpen: boolean;
  onClose: () => void;
  district: District;
  player: PlayerCharacter;
  onRest: (cost: number) => void;
}

export const InnRestModal: React.FC<InnRestModalProps> = ({
  isOpen,
  onClose,
  district,
  player,
  onRest,
}) => {
  if (!isOpen) return null;

  const cost = district.innCost;
  const canAfford = player.vitals.twd >= cost;

  const handleConfirmRest = () => {
    if (!canAfford) return;
    sound.playSuccess();
    onRest(cost);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0b101c] border border-amber-600/50 rounded-2xl p-6 shadow-[0_0_35px_rgba(245,158,11,0.2)]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400">
              <Bed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{district.name} · 在地旅社客棧</h2>
              <p className="text-xs text-slate-400">避難庇護所與體能恢復中心</p>
            </div>
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

        {/* Body */}
        <div className="py-5 space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            在連鎖商旅或巷弄老民宿中卸下行囊，緊閉門窗點燃安神檀香。在此休整可使漫遊者的移動體力、身體傷勢與受驚嚇的理智全面恢復。
          </p>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="text-[10px] text-slate-400">體力恢復</div>
              <div className="font-bold text-amber-400 font-mono mt-0.5">100% 補滿</div>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <Heart className="w-4 h-4 text-rose-400 mx-auto mb-1" />
              <div className="text-[10px] text-slate-400">傷勢治療</div>
              <div className="font-bold text-rose-400 font-mono mt-0.5">HP +50</div>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <Brain className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
              <div className="text-[10px] text-slate-400">安神醒腦</div>
              <div className="font-bold text-cyan-400 font-mono mt-0.5">SAN +40</div>
            </div>
          </div>

          <div className="p-3 bg-amber-950/30 border border-amber-900/40 rounded-xl flex items-center justify-between font-mono">
            <span className="text-slate-400">住宿一晚開銷:</span>
            <span className="text-amber-400 font-bold text-sm">${cost} TWD</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            目前持有: <span className="text-emerald-400 font-bold">${player.vitals.twd}</span>
          </div>

          <button
            onClick={handleConfirmRest}
            disabled={!canAfford}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold text-xs rounded-lg shadow-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {canAfford ? '確認入住休息' : '台幣餘額不足'}
          </button>
        </div>

      </div>
    </div>
  );
};
