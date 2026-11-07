import React from 'react';
import { PlayerCharacter, StatType } from '../types/game';
import { Heart, Brain, Zap, DollarSign, Award, Package, Sparkles, Bed, Compass } from 'lucide-react';
import { sound } from '../utils/audio';

interface StatsBarProps {
  player: PlayerCharacter;
  onOpenInventory: () => void;
  onOpenDivination: () => void;
  onOpenInn: () => void;
  onOpenTransit: () => void;
  onOpenMap: () => void;
  isMapOpen: boolean;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  player,
  onOpenInventory,
  onOpenDivination,
  onOpenInn,
  onOpenTransit,
  onOpenMap,
  isMapOpen,
}) => {
  const getModifier = (val: number, stat: StatType) => {
    // Add any active buff
    const buff = player.buffs.find((b) => b.stat === stat);
    const total = val + (buff ? buff.amount : 0);
    const mod = Math.floor((total - 10) / 2);
    return {
      total,
      mod: mod >= 0 ? `+${mod}` : `${mod}`,
    };
  };

  const hpPercent = Math.max(0, Math.min(100, (player.vitals.hp / player.vitals.maxHp) * 100));
  const sanPercent = Math.max(0, Math.min(100, (player.vitals.san / player.vitals.maxSan) * 100));
  const staPercent = Math.max(0, Math.min(100, (player.vitals.stamina / player.vitals.maxStamina) * 100));
  const expPercent = Math.max(0, Math.min(100, (player.vitals.exp / player.vitals.maxExp) * 100));

  const strInfo = getModifier(player.stats.STR, 'STR');
  const intInfo = getModifier(player.stats.INT, 'INT');
  const agiInfo = getModifier(player.stats.AGI, 'AGI');
  const lukInfo = getModifier(player.stats.LUK, 'LUK');

  return (
    <div className="bg-[#0b101c] border-b border-cyan-900/30 p-4 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-5 items-stretch xl:items-center justify-between">
        
        {/* Character Title & Vitals */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* HP Gauge */}
          <div
            className={`rounded-lg p-2.5 flex flex-col justify-between transition-all ${
              player.vitals.hp < 30
                ? 'bg-rose-950/80 border-2 border-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
                : 'bg-slate-900/80 border border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <Heart className={`w-3.5 h-3.5 fill-rose-500/20 ${player.vitals.hp < 30 ? 'animate-bounce text-rose-400' : ''}`} />
                生命值 (HP)
                {player.vitals.hp < 30 && (
                  <span className="text-[10px] bg-rose-900 text-rose-200 px-1.5 py-0.2 rounded font-mono font-bold">
                    瀕危
                  </span>
                )}
              </span>
              <span className={`font-mono tabular-nums ${player.vitals.hp < 30 ? 'text-rose-300 font-bold' : 'text-slate-200'}`}>
                {player.vitals.hp}/{player.vitals.maxHp}
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-rose-950">
              <div
                className={`h-full transition-all duration-300 ${
                  player.vitals.hp < 30 ? 'bg-rose-500 animate-pulse' : 'bg-rose-500'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* SAN Gauge */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Brain className="w-3.5 h-3.5 fill-cyan-500/20" />
                理智值 (SAN)
              </span>
              <span className="font-mono tabular-nums text-slate-200">
                {player.vitals.san}/{player.vitals.maxSan}
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-cyan-950">
              <div
                className={`h-full transition-all duration-300 ${
                  sanPercent <= 25 ? 'bg-purple-600 animate-pulse' : 'bg-cyan-500'
                }`}
                style={{ width: `${sanPercent}%` }}
              />
            </div>
          </div>

          {/* Stamina Gauge */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Zap className="w-3.5 h-3.5 fill-amber-500/20" />
                移動體力
              </span>
              <span className="font-mono tabular-nums text-slate-200">
                {player.vitals.stamina}/{player.vitals.maxStamina}
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-amber-950">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${staPercent}%` }}
              />
            </div>
          </div>

          {/* Economy & Level */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs">
            <div>
              <div className="text-slate-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>新台幣</span>
              </div>
              <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                ${player.vitals.twd.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 flex items-center gap-1 justify-end">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                <span>等級 Lv.{player.vitals.lv}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                EXP {player.vitals.exp}/{player.vitals.maxExp}
              </div>
            </div>
          </div>

        </div>

        {/* Core Attributes & Action Buttons */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-4">
          
          {/* Attributes cluster */}
          <div className="flex items-center gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80 text-xs">
            <div className="px-2 py-1 text-center" title="力量: 破除物理障礙、近身搏鬥">
              <div className="text-[10px] text-slate-500 font-bold">力量 STR</div>
              <div className="font-mono text-slate-200 font-bold">
                {strInfo.total} <span className="text-cyan-400 text-[11px]">({strInfo.mod})</span>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="px-2 py-1 text-center" title="智力: 破解古老符文、歷史考據">
              <div className="text-[10px] text-slate-500 font-bold">智力 INT</div>
              <div className="font-mono text-slate-200 font-bold">
                {intInfo.total} <span className="text-cyan-400 text-[11px]">({intInfo.mod})</span>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="px-2 py-1 text-center" title="敏捷: 閃躲危險、夜市穿梭逃跑">
              <div className="text-[10px] text-slate-500 font-bold">敏捷 AGI</div>
              <div className="font-mono text-slate-200 font-bold">
                {agiInfo.total} <span className="text-cyan-400 text-[11px]">({agiInfo.mod})</span>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="px-2 py-1 text-center" title="幸運: 探索隨機寶物、抽籤判定">
              <div className="text-[10px] text-slate-500 font-bold">幸運 LUK</div>
              <div className="font-mono text-slate-200 font-bold">
                {lukInfo.total} <span className="text-amber-400 text-[11px]">({lukInfo.mod})</span>
              </div>
            </div>
          </div>

          {/* Quick Hub Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onOpenMap();
              }}
              className={`px-3 py-2 border rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isMapOpen
                  ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-cyan-950/80 hover:bg-cyan-900 border-cyan-600/60 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{isMapOpen ? '返回事件' : '靈能地圖'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenInventory();
              }}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 rounded-md text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <Package className="w-3.5 h-3.5 text-cyan-400" />
              <span>行囊與合成</span>
              {player.inventory.length > 0 && (
                <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1.5 rounded font-mono border border-cyan-800">
                  {player.inventory.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenTransit();
              }}
              className="px-3 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/60 rounded-md text-xs font-semibold text-cyan-200 flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all cursor-pointer whitespace-nowrap"
            >
              <span>搭乘交通</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenInn();
              }}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500 rounded-md text-xs font-medium text-amber-200 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <Bed className="w-3.5 h-3.5 text-amber-400" />
              <span>旅宿休整</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenDivination();
              }}
              className="px-3 py-2 bg-gradient-to-r from-purple-950 to-indigo-950 hover:from-purple-900 hover:to-indigo-900 border border-purple-500/50 rounded-md text-xs font-medium text-purple-200 flex items-center gap-1.5 shadow-[0_0_8px_rgba(168,85,247,0.2)] transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>感應地脈</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
