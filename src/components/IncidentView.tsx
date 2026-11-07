import React, { useState, useEffect } from 'react';
import { District, Incident, IncidentChoice, PlayerCharacter } from '../types/game';
import { sound } from '../utils/audio';
import { ShieldAlert, Compass, Sparkles, MapPin, Store, CheckCircle, ChevronRight, AlertCircle, ShoppingBag, EyeOff } from 'lucide-react';

interface IncidentViewProps {
  district: District;
  player: PlayerCharacter;
  onSelectChoice: (incident: Incident, choice: IncidentChoice) => void;
  onBuyItem: (item: any) => void;
}

const OCCULT_GLITCH_CHARS = '§†‡ΨΩ░▒▓█▓▒░#$@!%&?*※▲▼◆◇λμνπσφψω01不可直視祂在深淵地脈裂隙魂魄離散虛妄混沌失序';

function generateCorruptedText(source: string): string {
  return source
    .split('')
    .map((ch) => {
      if (ch === ' ' || ch === '\n') return ch;
      return Math.random() < 0.7
        ? OCCULT_GLITCH_CHARS[Math.floor(Math.random() * OCCULT_GLITCH_CHARS.length)]
        : ch;
    })
    .join('');
}

export const IncidentView: React.FC<IncidentViewProps> = ({
  district,
  player,
  onSelectChoice,
  onBuyItem,
}) => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(district.incidents[0] || null);
  const [showShop, setShowShop] = useState(false);

  // Low SAN Glitch State (< 30 SAN)
  const [isSanGlitched, setIsSanGlitched] = useState(false);
  const [corruptedMap, setCorruptedMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (player.vitals.san >= 30) {
      setIsSanGlitched(false);
      return;
    }

    let timeoutId: any = null;
    let revertTimeoutId: any = null;

    const scheduleNextGlitch = () => {
      // Random delay between 3.5s and 6.0s
      const delay = 3500 + Math.random() * 2500;
      timeoutId = setTimeout(() => {
        // Scramble descriptions
        const newMap: Record<string, string> = {};
        district.incidents.forEach((inc) => {
          newMap[inc.id] = generateCorruptedText(inc.description);
        });
        setCorruptedMap(newMap);
        setIsSanGlitched(true);
        sound.playGlitchStatic();

        // Exactly 1 second (1000ms) glitch duration
        revertTimeoutId = setTimeout(() => {
          setIsSanGlitched(false);
          scheduleNextGlitch();
        }, 1000);
      }, delay);
    };

    scheduleNextGlitch();

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(revertTimeoutId);
    };
  }, [player.vitals.san, district.incidents]);

  // Check if incident was already investigated
  const isInvestigated = (incId: string) => player.investigatedIncidents.includes(incId);

  return (
    <div className="space-y-6">
      
      {/* District Hero Card */}
      <div className="bg-[#0b101d] border border-cyan-900/40 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <span>{district.region}</span>
              <span>/</span>
              <span>{district.county}</span>
              <span>/</span>
              <span className="text-amber-400">靈能裂隙 Lv.{district.occultLevel}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 glow-cyan">
              {district.name}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-amber-300/90 mt-1.5">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{district.landmark}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sound.playClick();
                setShowShop(!showShop);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                showShop
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-600'
              }`}
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span>{showShop ? '收起在地商攤' : '逛在地小吃與香鋪'}</span>
            </button>
          </div>
        </div>

        {/* Atmosphere Prose */}
        <p className="mt-4 text-xs sm:text-sm text-slate-300/90 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 font-serif">
          {district.atmosphere}
        </p>
      </div>

      {/* Local Shop Drawer */}
      {showShop && (
        <div className="bg-slate-950/90 border border-amber-600/40 rounded-2xl p-5 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-amber-950">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>{district.name} · 在地補給攤販</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              持有現款: <span className="text-emerald-400 font-bold">${player.vitals.twd}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {district.storeItems.map((item) => {
              const canAfford = player.vitals.twd >= item.value;

              return (
                <div
                  key={item.id}
                  className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="text-slate-100">{item.name}</span>
                      <span className="text-emerald-400 font-mono font-bold">${item.value}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight mb-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      {item.effects?.hp && `HP +${item.effects.hp} `}
                      {item.effects?.san && `SAN +${item.effects.san} `}
                      {item.effects?.stamina && `體力 +${item.effects.stamina}`}
                    </span>
                    <button
                      onClick={() => {
                        sound.playSuccess();
                        onBuyItem(item);
                      }}
                      disabled={!canAfford}
                      className="px-3 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-500/50 text-amber-300 rounded font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      購買一份
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Incident Investigation Area */}
      <div className="bg-[#0b101d] border border-cyan-900/40 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
            <h3 className="text-base font-bold text-slate-100">
              在地靈能異聞調查事件 (OCCULT INCIDENT)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            已解決異聞: {player.solvedCount} 件
          </span>
        </div>

        {district.incidents.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            此鄉鎮目前靈氣平穩，暫無突發之超自然怪談事件。可搭乘交通工具前往其他縣市調查。
          </div>
        ) : (
          district.incidents.map((incident) => {
            const investigated = isInvestigated(incident.id);

            return (
              <div key={incident.id} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 font-mono font-semibold">
                      {incident.tag}
                    </span>
                    <h4 className="text-lg font-bold text-slate-100">{incident.title}</h4>
                  </div>
                  {investigated && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      此事件已調查結案
                    </span>
                  )}
                </div>

                {/* Narrative Description with Low SAN Glitch support */}
                <div
                  className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed transition-all duration-150 ${
                    isSanGlitched
                      ? 'bg-purple-950/90 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] san-glitch-active select-none'
                      : 'bg-slate-950/80 border-slate-800 text-slate-200 font-serif'
                  }`}
                >
                  {isSanGlitched ? (
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-purple-300 font-mono mb-2 pb-1 border-b border-purple-800/60">
                        <span className="flex items-center gap-1 font-bold">
                          <EyeOff className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                          ⚠️【理智崩解 · 幻覺失真中 1.0s】
                        </span>
                        <span className="text-purple-400 font-bold">SAN: {player.vitals.san}/100</span>
                      </div>
                      <p className="font-mono text-purple-200 tracking-wider break-all drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
                        {corruptedMap[incident.id] || generateCorruptedText(incident.description)}
                      </p>
                    </div>
                  ) : (
                    incident.description
                  )}
                </div>

                {/* Action Choices */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-bold text-slate-400 tracking-wider">
                    {investigated ? '再次模擬或回顧行動選項：' : '選擇你的行動策略（將進行 D20 骰子檢定）：'}
                  </div>

                  {incident.choices.map((choice, idx) => {
                    const hasCheck = !!choice.statCheck;

                    return (
                      <button
                        key={choice.id}
                        onClick={() => {
                          sound.playClick();
                          onSelectChoice(incident, choice);
                        }}
                        className="w-full text-left p-4 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500 transition-all flex items-center justify-between gap-4 group cursor-pointer"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-200 group-hover:text-cyan-300 transition-colors">
                            <span className="text-cyan-400 font-mono">0{idx + 1}.</span>
                            <span>{choice.text}</span>
                          </div>

                          {hasCheck && (
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3 font-mono">
                              <span>
                                檢定屬性: <span className="text-cyan-400 font-bold">{choice.statCheck!.stat}</span>
                              </span>
                              <span>·</span>
                              <span>
                                目標難度: <span className="text-amber-400 font-bold">DC {choice.statCheck!.dc}</span>
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center gap-2 text-xs text-slate-500 group-hover:text-cyan-400 transition-colors">
                          <span className="hidden sm:inline">執行判定</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Investigation Journal Log */}
      <div className="bg-[#0b101d] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
        <h4 className="text-xs font-bold text-slate-400 tracking-wider mb-3">
          漫遊者調查日誌 (INVESTIGATION JOURNAL)
        </h4>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {player.journal.slice().reverse().map((entry, idx) => (
            <div
              key={idx}
              className="text-xs p-2.5 bg-slate-950/70 border border-slate-900 rounded-lg flex items-start gap-2.5 font-mono"
            >
              <span className="text-slate-500 shrink-0 text-[11px]">{entry.timestamp}</span>
              <span className="text-slate-300 leading-normal">{entry.text}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
