import React, { useState } from 'react';
import { GAME_REGIONS } from '../data/gameData';
import { District } from '../types/game';
import { sound } from '../utils/audio';
import { Compass, MapPin, Radio, ShieldAlert, X, Navigation, Ship, Train, Bus } from 'lucide-react';
import mapImage from '../assets/images/taiwan_leyline_map_1793433214149.jpg';

interface TaiwanLeylineMapProps {
  currentDistrictId: string;
  onSelectDistrict: (district: District) => void;
  onClose?: () => void;
}

export const TaiwanLeylineMap: React.FC<TaiwanLeylineMapProps> = ({
  currentDistrictId,
  onSelectDistrict,
  onClose,
}) => {
  // Flatten all districts for lookup
  const allDistricts: District[] = [];
  GAME_REGIONS.forEach((r) => {
    r.counties.forEach((c) => {
      c.districts.forEach((d) => allDistricts.push(d));
    });
  });

  const currentDistrict = allDistricts.find((d) => d.id === currentDistrictId) || allDistricts[0];
  const [targetDistrictId, setTargetDistrictId] = useState<string>(
    allDistricts.find((d) => d.id !== currentDistrictId)?.id || currentDistrict.id
  );

  const targetDistrict = allDistricts.find((d) => d.id === targetDistrictId) || currentDistrict;
  const isTargetCurrent = targetDistrict.id === currentDistrict.id;

  return (
    <div className="bg-[#080d1a] border border-cyan-900/50 rounded-2xl p-4 sm:p-6 shadow-2xl relative flex flex-col gap-5">
      
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 tracking-wider flex items-center gap-2">
              <span>全台靈能地脈戰術星圖</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-mono">
                TAIWAN LEY LINE MAP
              </span>
            </h3>
            <p className="text-[11px] text-cyan-400/80">
              全島靈能地脈與離島航線圖鑑 · 如需跨區移動請至下方選擇目的地搭車
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ml-auto"
          >
            <X className="w-4 h-4 text-cyan-400" />
            <span>返回事件調查</span>
          </button>
        )}
      </div>

      {/* Main Content Layout: Static Map Image + Tactical Info / Travel Panel */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* Tactical Map Image Container (Interactive clicks removed, pure image display as requested) */}
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-[540px] bg-slate-950 rounded-2xl border-2 border-cyan-500/30 p-2 relative shadow-2xl overflow-hidden group">
            
            {/* Top Tactical Label Overlay */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-2.5 py-1 rounded bg-slate-950/80 border border-cyan-500/40 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] font-mono text-cyan-300 tracking-wider">
                SATELLITE LEY LINE SURVEILLANCE
              </span>
            </div>

            {/* Static Tactical Map Image */}
            <img
              src={mapImage}
              alt="台灣靈能地脈戰術地圖"
              className="w-full h-auto rounded-xl object-contain filter contrast-105 brightness-95"
              loading="eager"
            />

            {/* Bottom Status Ticker */}
            <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-950/85 border border-cyan-900/80 backdrop-blur-md rounded-lg p-2.5 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-slate-300 font-medium">當前位置:</span>
                <span className="font-bold text-cyan-300">{currentDistrict.name}</span>
                <span className="text-[11px] text-slate-400">({currentDistrict.county})</span>
              </div>
              <span className="text-[11px] text-amber-400 font-bold hidden sm:inline">
                威脅 Lv.{currentDistrict.occultLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Travel and Destination Hub (Simple, reliable dropdown & buttons) */}
        <div className="w-full lg:w-96 flex flex-col justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="space-y-4">
            
            {/* Current Location Badge */}
            <div className="bg-slate-950/90 p-3 rounded-xl border border-cyan-900/50">
              <span className="text-[10px] text-cyan-400 font-mono block mb-1">
                CURRENT DISTRICT // 當前駐足
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                    <span>{currentDistrict.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700 font-normal">
                      所在分區
                    </span>
                  </h4>
                  <p className="text-xs text-amber-300 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{currentDistrict.landmark}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-rose-400 font-bold block">
                    威脅: {'★'.repeat(currentDistrict.occultLevel)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {currentDistrict.region}
                  </span>
                </div>
              </div>
            </div>

            {/* Travel Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>選擇想前往的島嶼分區：</span>
              </label>

              <select
                value={targetDistrictId}
                onChange={(e) => {
                  sound.playClick();
                  setTargetDistrictId(e.target.value);
                }}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-cyan-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
              >
                {GAME_REGIONS.map((region) => (
                  <optgroup key={region.name} label={`【${region.name}】`}>
                    {region.counties.flatMap((c) =>
                      c.districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({c.name}) {d.id === currentDistrictId ? '★ 目前所在' : ''}
                        </option>
                      ))
                    )}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Target District Quick Overview */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">目地分區資訊:</span>
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>威脅 Lv.{targetDistrict.occultLevel}</span>
                </span>
              </div>
              <h5 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                <span>{targetDistrict.name}</span>
                <span className="text-xs text-slate-400 font-normal">
                  ({targetDistrict.county} · {targetDistrict.region})
                </span>
              </h5>
              <p className="text-[11px] text-slate-300 leading-relaxed italic border-l-2 border-cyan-700 pl-2">
                "{targetDistrict.atmosphere}"
              </p>

              {/* Transit hints for target */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1.5">
                  可用交通工具前往:
                </span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {targetDistrict.hasStation.thsr && (
                    <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                      🚅 高鐵
                    </span>
                  )}
                  {targetDistrict.hasStation.tra && (
                    <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800 flex items-center gap-1">
                      🚆 台鐵
                    </span>
                  )}
                  {targetDistrict.hasStation.bus && (
                    <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800 flex items-center gap-1">
                      🚌 客運
                    </span>
                  )}
                  {targetDistrict.hasStation.ferry && (
                    <span className="px-2 py-0.5 rounded bg-teal-950/90 text-teal-300 border border-teal-700 flex items-center gap-1 font-bold">
                      ⛴️ 渡輪/快艇
                    </span>
                  )}
                  {targetDistrict.hasStation.taxi && (
                    <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 flex items-center gap-1">
                      🚕 計程車
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  sound.playClick();
                  onSelectDistrict(targetDistrict);
                }}
                className={`w-full py-3 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isTargetCurrent
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                }`}
              >
                <span>
                  {isTargetCurrent
                    ? '👉 前往交通轉運中心 (挑選車票出發)'
                    : `🚀 前往轉運中心搭車至【${targetDistrict.name.split(' · ')[1] || targetDistrict.name}】`}
                </span>
              </button>

              {onClose && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onClose();
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-medium text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>返回事件調查現場</span>
                </button>
              )}
            </div>

          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
            全台 22 縣市靈脈巡禮 · 異聞調查組織戰術情報部
          </div>
        </div>

      </div>

    </div>
  );
};
