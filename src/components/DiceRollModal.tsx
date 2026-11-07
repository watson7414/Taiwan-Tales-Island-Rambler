import React, { useState, useEffect, useRef } from 'react';
import { StatType } from '../types/game';
import { sound } from '../utils/audio';
import { Sparkles, AlertTriangle, ShieldCheck, Dice5, Zap, Timer } from 'lucide-react';

interface DiceRollModalProps {
  isOpen: boolean;
  stat: StatType;
  statName: string;
  statValue: number;
  statModifier: number;
  dc: number;
  actionText: string;
  onComplete: (
    success: boolean,
    roll: number,
    total: number,
    isNat20: boolean,
    isNat1: boolean,
    wasQteEvaded?: boolean
  ) => void;
  onCancel: () => void;
}

export const DiceRollModal: React.FC<DiceRollModalProps> = ({
  isOpen,
  stat,
  statName,
  statValue,
  statModifier,
  dc,
  actionText,
  onComplete,
  onCancel,
}) => {
  const [rolling, setRolling] = useState(false);
  const [displayRoll, setDisplayRoll] = useState<number>(10);
  const [finalResult, setFinalResult] = useState<{
    roll: number;
    total: number;
    success: boolean;
    isNat20: boolean;
    isNat1: boolean;
    wasQteEvaded?: boolean;
  } | null>(null);

  // QTE States
  const [qteActive, setQteActive] = useState(false);
  const [qteCursor, setQteCursor] = useState(50);
  const [qteTarget, setQteTarget] = useState({ start: 38, end: 62 });
  const [qteTimeLeft, setQteTimeLeft] = useState(3.0);
  const [qteOutcome, setQteOutcome] = useState<'success' | 'fail' | null>(null);

  // Keep references for animation loop
  const qteAnimRef = useRef<number | null>(null);
  const qteStartTimeRef = useRef<number>(0);
  const pendingCheckRef = useRef<{ roll: number; total: number; isNat1: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRolling(false);
      setFinalResult(null);
      setDisplayRoll(10);
      setQteActive(false);
      setQteOutcome(null);
      pendingCheckRef.current = null;
      if (qteAnimRef.current) cancelAnimationFrame(qteAnimRef.current);
    }
    return () => {
      if (qteAnimRef.current) cancelAnimationFrame(qteAnimRef.current);
    };
  }, [isOpen]);

  // QTE loop using requestAnimationFrame
  useEffect(() => {
    if (!qteActive) {
      if (qteAnimRef.current) cancelAnimationFrame(qteAnimRef.current);
      return;
    }

    qteStartTimeRef.current = performance.now();
    const durationMs = 3000; // 3.0 seconds window

    const loop = (time: number) => {
      const elapsed = time - qteStartTimeRef.current;
      const remainingSec = Math.max(0, (durationMs - elapsed) / 1000);
      setQteTimeLeft(remainingSec);

      // Fast oscillation of needle (0% -> 100% -> 0%)
      const speed = 0.0045; // frequency
      const pos = (Math.sin(time * speed) + 1) / 2 * 100;
      setQteCursor(pos);

      if (elapsed >= durationMs) {
        // Time expired! QTE Failure
        resolveQte(false);
        return;
      }

      qteAnimRef.current = requestAnimationFrame(loop);
    };

    qteAnimRef.current = requestAnimationFrame(loop);

    // Keyboard spacebar listener for instant reaction
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        triggerQteAction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (qteAnimRef.current) cancelAnimationFrame(qteAnimRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [qteActive]);

  if (!isOpen) return null;

  const handleRoll = () => {
    if (rolling || finalResult || qteActive) return;
    setRolling(true);
    sound.playDiceRoll();

    let counter = 0;
    const interval = setInterval(() => {
      setDisplayRoll(Math.floor(Math.random() * 20) + 1);
      counter++;
      if (counter > 16) {
        clearInterval(interval);

        const realRoll = Math.floor(Math.random() * 20) + 1;
        const total = realRoll + statModifier;
        const isNat20 = realRoll === 20;
        const isNat1 = realRoll === 1;
        const isSuccess = isNat20 ? true : isNat1 ? false : total >= dc;

        setDisplayRoll(realRoll);
        setRolling(false);

        if (isSuccess) {
          // Success outright
          setFinalResult({
            roll: realRoll,
            total,
            success: true,
            isNat20,
            isNat1,
          });
          if (isNat20) {
            sound.playCriticalSuccess();
          } else {
            sound.playSuccess();
          }
        } else {
          // Check Failed! Random chance to trigger emergency QTE (65% chance)
          const qteChance = Math.random();
          if (qteChance < 0.65) {
            // Trigger emergency QTE
            pendingCheckRef.current = { roll: realRoll, total, isNat1 };
            sound.playQteAlarm();

            // Set target zone based on player's stat (wider target zone for higher AGI/LUK)
            const targetWidth = 24 + Math.max(0, statModifier * 2);
            const targetStart = Math.floor(35 + Math.random() * 10);
            setQteTarget({ start: targetStart, end: targetStart + targetWidth });
            setQteOutcome(null);
            setQteActive(true);
          } else {
            // Normal failure without QTE
            setFinalResult({
              roll: realRoll,
              total,
              success: false,
              isNat20: false,
              isNat1,
            });
            sound.playFailure();
          }
        }
      }
    }, 65);
  };

  const triggerQteAction = () => {
    if (!qteActive || qteOutcome) return;
    const isHit = qteCursor >= qteTarget.start && qteCursor <= qteTarget.end;
    resolveQte(isHit);
  };

  const resolveQte = (hit: boolean) => {
    if (qteAnimRef.current) cancelAnimationFrame(qteAnimRef.current);
    setQteActive(false);
    setQteOutcome(hit ? 'success' : 'fail');

    const pending = pendingCheckRef.current;
    const roll = pending ? pending.roll : displayRoll;
    const total = pending ? pending.total : roll + statModifier;
    const isNat1 = pending ? pending.isNat1 : false;

    if (hit) {
      sound.playCriticalSuccess();
      setFinalResult({
        roll,
        total,
        success: true, // Reaction succeeded! Avoided failure!
        isNat20: false,
        isNat1,
        wasQteEvaded: true,
      });
    } else {
      sound.playFailure();
      setFinalResult({
        roll,
        total,
        success: false, // Reaction failed, failure stays unchanged!
        isNat20: false,
        isNat1,
        wasQteEvaded: false,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-lg bg-[#0c1222] border-2 rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all duration-300 ${
          qteActive
            ? 'border-rose-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]'
            : finalResult?.wasQteEvaded
            ? 'border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.4)]'
            : 'border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.25)]'
        }`}
      >
        {/* Subtle decorative background grids */}
        <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-950/80 border border-cyan-500/40 rounded-full text-xs text-cyan-300 font-semibold mb-2">
            <Dice5 className="w-4 h-4 text-cyan-400" />
            <span>D20 命運檢定 // SKILL CHECK</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">{actionText}</h2>
          <div className="text-xs text-slate-400 mt-1">
            依賴屬性: <span className="text-cyan-400 font-semibold">{statName} ({stat})</span> · 屬性值: <span className="text-slate-200 font-mono">{statValue}</span> · 修正值: <span className="text-amber-400 font-mono font-bold">{statModifier >= 0 ? `+${statModifier}` : statModifier}</span>
          </div>
        </div>

        {/* Target DC & Formula Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 mb-6 flex items-center justify-between text-xs sm:text-sm">
          <div className="text-slate-400">
            檢定目標難度: <span className="text-amber-400 font-bold font-mono text-base">DC {dc}</span>
          </div>
          <div className="text-slate-400 font-mono">
            判定式: <span className="text-cyan-300">D20</span> + <span className="text-amber-300">({statModifier >= 0 ? `+${statModifier}` : statModifier})</span> ≥ <span className="text-amber-400">{dc}</span>
          </div>
        </div>

        {/* Main Center Area: Either Dice Presentation or Active QTE Event */}
        {!qteActive ? (
          <div className="py-6 flex flex-col items-center justify-center relative">
            <div
              className={`w-36 h-36 rounded-2xl flex items-center justify-center transition-all duration-300 relative ${
                rolling
                  ? 'scale-110 rotate-12 bg-cyan-950/80 border-4 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.6)] animate-bounce'
                  : finalResult
                  ? finalResult.isNat20
                    ? 'bg-amber-950/90 border-4 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.8)] scale-105'
                    : finalResult.wasQteEvaded
                    ? 'bg-emerald-950/90 border-4 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.8)] scale-105'
                    : finalResult.isNat1
                    ? 'bg-rose-950/90 border-4 border-rose-500 shadow-[0_0_40px_rgba(239,68,68,0.8)] scale-95'
                    : finalResult.success
                    ? 'bg-emerald-950/80 border-4 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                    : 'bg-slate-900 border-4 border-rose-800 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                  : 'bg-slate-900/90 border-2 border-dashed border-cyan-500/40 hover:border-cyan-400'
              }`}
            >
              <div className="text-center">
                <div
                  className={`text-5xl font-black font-mono tracking-tighter ${
                    finalResult?.isNat20
                      ? 'text-amber-300 glow-amber'
                      : finalResult?.wasQteEvaded
                      ? 'text-emerald-300 glow-emerald'
                      : finalResult?.isNat1
                      ? 'text-rose-400 glow-crimson'
                      : finalResult?.success
                      ? 'text-emerald-300 glow-emerald'
                      : finalResult
                      ? 'text-rose-400'
                      : 'text-cyan-400'
                  }`}
                >
                  {displayRoll}
                </div>
                <div className="text-[10px] tracking-widest uppercase font-mono text-slate-400 mt-1">
                  {rolling ? 'ROLLING...' : finalResult ? 'D20 骰值' : '點擊擲骰'}
                </div>
              </div>
            </div>

            {/* Outcome Verdict Banner */}
            {finalResult && (
              <div className="mt-5 text-center animate-fade-in">
                {finalResult.isNat20 ? (
                  <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-lg glow-amber">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span>大成功！(NATURAL 20)</span>
                  </div>
                ) : finalResult.wasQteEvaded ? (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-lg glow-emerald">
                      <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
                      <span>⚡ 急中生智！QTE 反應成功迴避失敗！</span>
                    </div>
                    <span className="text-xs text-emerald-400/90">
                      千鈞一髮化險為夷，懲罰抵銷並成功推進！
                    </span>
                  </div>
                ) : finalResult.isNat1 ? (
                  <div className="flex items-center justify-center gap-2 text-rose-400 font-bold text-lg glow-crimson">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    <span>大失敗！(CRITICAL FUMBLE 1)</span>
                  </div>
                ) : finalResult.success ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-300 font-bold text-lg glow-emerald">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>檢定通過 (SUCCESS)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-lg">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <span>檢定失敗 (FAILURE)</span>
                    </div>
                    {qteOutcome === 'fail' && (
                      <span className="text-xs text-rose-400/80">
                        QTE 反應未中，判定維持失敗！
                      </span>
                    )}
                  </div>
                )}

                <div className="text-xs text-slate-300 font-mono mt-1.5">
                  總得分 = {finalResult.roll} + ({statModifier >= 0 ? `+${statModifier}` : statModifier}) ={' '}
                  <span className="font-bold text-slate-100 text-sm">{finalResult.total}</span> (目標 DC: {dc})
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ACTIVE EMERGENCY QTE INTERFACE */
          <div className="py-4 px-2 space-y-4 animate-fade-in">
            {/* Warning Banner */}
            <div className="p-3 bg-rose-950/90 border-2 border-rose-500 rounded-xl text-center shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse">
              <div className="flex items-center justify-center gap-2 text-rose-300 font-black text-sm tracking-wider">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>⚠️ 判定未達標！觸發緊急 QTE 迴避反應 ⚠️</span>
              </div>
              <div className="text-[11px] text-rose-200 mt-1">
                當指針滑入綠色【靈能反制區】瞬間按下，即可成功化險為夷、迴避失敗！
              </div>
            </div>

            {/* Countdown Timer Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-amber-400">
                  <Timer className="w-3.5 h-3.5" />
                  反應剩餘時間
                </span>
                <span className="font-bold text-slate-100 tabular-nums">
                  {qteTimeLeft.toFixed(2)} 秒
                </span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-rose-500 transition-all duration-75"
                  style={{ width: `${(qteTimeLeft / 3.0) * 100}%` }}
                />
              </div>
            </div>

            {/* Timing Strike Gauge */}
            <div className="pt-2">
              <div className="relative w-full h-14 bg-slate-950 rounded-xl border-2 border-cyan-900/60 overflow-hidden shadow-inner">
                {/* Background tick marks */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px)] bg-[size:10%_100%] opacity-20 pointer-events-none" />

                {/* Target Evasion Sweet Spot Zone */}
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500/35 border-x-2 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center"
                  style={{
                    left: `${qteTarget.start}%`,
                    width: `${qteTarget.end - qteTarget.start}%`,
                  }}
                >
                  <span className="text-[10px] text-emerald-200 font-bold tracking-wider select-none font-mono">
                    ⚡反制區
                  </span>
                </div>

                {/* Moving Indicator Needle */}
                <div
                  className="absolute top-0 bottom-0 w-3 bg-amber-300 border border-white shadow-[0_0_12px_rgba(245,158,11,1)] -ml-1.5 transition-none"
                  style={{ left: `${qteCursor}%` }}
                >
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-amber-400 -mt-2 -ml-1" />
                </div>
              </div>
            </div>

            {/* Big Tactile Trigger Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={triggerQteAction}
                className="w-full py-4 bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-black text-sm rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5 text-yellow-300 animate-bounce" />
                <span>即刻按下 / 空白鍵 SPACE 觸發極限閃避！</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          {!finalResult && !qteActive ? (
            <>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onCancel();
                }}
                disabled={rolling}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                取消並重選
              </button>
              <button
                type="button"
                onClick={handleRoll}
                disabled={rolling}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer disabled:opacity-50"
              >
                {rolling ? '命運擲骰中...' : '擲出 D20 骰子'}
              </button>
            </>
          ) : finalResult ? (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onComplete(
                  finalResult.success,
                  finalResult.roll,
                  finalResult.total,
                  finalResult.isNat20,
                  finalResult.isNat1,
                  finalResult.wasQteEvaded
                );
              }}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
            >
              {finalResult.wasQteEvaded
                ? '確認迴避成功，化險為夷推進劇情'
                : '確認檢定結果，推進劇情'}
            </button>
          ) : null}
        </div>

      </div>
    </div>
  );
};
