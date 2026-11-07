import React, { useState } from 'react';
import { District, PlayerCharacter } from '../types/game';
import { sound } from '../utils/audio';
import { Sparkles, X, Radio, BookOpen, Compass, RefreshCw } from 'lucide-react';

interface GeminiDivinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  district: District;
  player: PlayerCharacter;
  onReceiveBlessing: (stat: 'STR' | 'INT' | 'AGI' | 'LUK', omen: string) => void;
}

export const GeminiDivinationModal: React.FC<GeminiDivinationModalProps> = ({
  isOpen,
  onClose,
  district,
  player,
  onReceiveBlessing,
}) => {
  const [loading, setLoading] = useState(false);
  const [oracleData, setOracleData] = useState<{
    title: string;
    content: string;
    omen: string;
    recommendedStat?: 'STR' | 'INT' | 'AGI' | 'LUK';
    statTip?: string;
    source?: string;
  } | null>(null);
  const [blessingReceived, setBlessingReceived] = useState(false);

  if (!isOpen) return null;

  const handleCommuneLeyLine = async () => {
    setLoading(true);
    setBlessingReceived(false);
    sound.playClick();

    try {
      const response = await fetch('/api/divine-rumor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: district.region,
          county: district.county,
          district: district.name,
          landmark: district.landmark,
          timeOfDay: '深夜子時 · 陰陽交接',
        }),
      });

      const data = await response.json();
      setOracleData(data);
      sound.playSuccess();
    } catch {
      // Local fallback
      setOracleData({
        title: `【${district.name} · 古老靈波觀測】`,
        content: `指針在${district.landmark}上方劇烈震盪，隱約有道家金光自地下升騰。空氣中瀰漫著陳年線香氣息，百年前的結界正在緩慢運轉。`,
        omen: '吉凶參半 · 地脈暗湧',
        recommendedStat: 'INT',
        statTip: '以靜制動，洞察符文奧秘。',
      });
      sound.playSuccess();
    } finally {
      setLoading(false);
    }
  };

  const handleClaimBlessing = () => {
    if (!oracleData || blessingReceived) return;
    const stat = oracleData.recommendedStat || 'LUK';
    sound.playCriticalSuccess();
    onReceiveBlessing(stat, oracleData.omen);
    setBlessingReceived(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#0d0e1c] border border-purple-500/50 rounded-2xl p-6 shadow-[0_0_40px_rgba(168,85,247,0.25)] relative overflow-hidden">
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-900/40 relative">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-500/50 text-purple-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>地脈感應與靈能占卜 (LEY-LINE ORACLE)</span>
              </h2>
              <p className="text-xs text-purple-400/80">
                以 AI 儀軌共鳴當前鄉鎮地脈，探查未解之在地怪談與天地卦象。
              </p>
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
        <div className="py-5 space-y-4 text-xs text-slate-300 relative">
          
          <div className="p-3 bg-purple-950/20 border border-purple-900/50 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[11px] text-purple-400">當前感應樞紐</div>
              <div className="font-bold text-slate-100 text-sm mt-0.5">{district.name}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400">地標節點</div>
              <div className="text-amber-400 font-mono text-xs mt-0.5">{district.landmark}</div>
            </div>
          </div>

          {!oracleData ? (
            <div className="text-center py-8 space-y-3">
              <Compass className="w-12 h-12 text-purple-400/40 mx-auto animate-spin" style={{ animationDuration: '15s' }} />
              <p className="text-slate-400 max-w-xs mx-auto leading-relaxed">
                漫遊者可手持八卦尋龍定盤，閉目冥想，引導當前鄉鎮山川地脈的靈氣流轉。
              </p>
              <button
                onClick={handleCommuneLeyLine}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? '地脈共振感應中...' : '開始共振感應'}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-950/90 border border-purple-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-950 pb-2">
                  <h4 className="font-bold text-slate-100 text-sm">{oracleData.title}</h4>
                  <span className="text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950/50 border border-amber-800 text-[11px]">
                    {oracleData.omen}
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed font-serif text-[13px]">
                  {oracleData.content}
                </p>

                {oracleData.statTip && (
                  <div className="p-2.5 bg-purple-950/40 rounded-lg border border-purple-900/60 text-purple-300 text-[11px] flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>漫遊者叮嚀：{oracleData.statTip}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleCommuneLeyLine}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>重新引導共振</span>
                </button>

                <button
                  onClick={handleClaimBlessing}
                  disabled={blessingReceived}
                  className={`px-5 py-2 font-bold text-xs rounded-lg transition-all ${
                    blessingReceived
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 cursor-default'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg cursor-pointer'
                  }`}
                >
                  {blessingReceived ? '✓ 已領受地脈靈能庇佑 (+SAN, +屬性)' : '領受天地靈能庇佑'}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
