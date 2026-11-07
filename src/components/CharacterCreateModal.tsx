import React, { useState } from 'react';
import { CoreStats, PlayerCharacter } from '../types/game';
import { INITIAL_ITEMS } from '../data/gameData';
import { sound } from '../utils/audio';
import { Sparkles, User, Shield, Compass, BookOpen, Check } from 'lucide-react';

interface CharacterCreateModalProps {
  isOpen: boolean;
  onComplete: (character: PlayerCharacter) => void;
}

const ARCHETYPES = [
  {
    id: 'taoist',
    name: '符法道士 (Taoist Exorcist)',
    desc: '家傳道壇正統傳人，擅長破解古籍秘本、安撫幽魂與修復封印符陣。',
    stats: { STR: 10, INT: 14, AGI: 11, LUK: 13 },
    icon: '📜',
  },
  {
    id: 'ranger',
    name: '山林巡守員 (Mountain Ranger)',
    desc: '長年穿梭於中央山脈與偏遠林道，體魄強健、反應迅速，無懼險峻惡地。',
    stats: { STR: 14, INT: 11, AGI: 13, LUK: 10 },
    icon: '🌲',
  },
  {
    id: 'journalist',
    name: '靈能調查記者 (Occult Journalist)',
    desc: '專門探訪全台各大都市怪談與夜市秘聞，敏銳機警，擅長穿梭人潮避險。',
    stats: { STR: 9, INT: 13, AGI: 14, LUK: 12 },
    icon: '📷',
  },
  {
    id: 'geomancer',
    name: '尋龍風水師 (Leyline Geomancer)',
    desc: '精通島嶼山川地脈走向，靈感第六感極強，常能在奇遇中逢凶化吉。',
    stats: { STR: 10, INT: 12, AGI: 11, LUK: 15 },
    icon: '🧭',
  },
];

export const CharacterCreateModal: React.FC<CharacterCreateModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [name, setName] = useState('徐漫天');
  const [selectedArchId, setSelectedArchId] = useState('taoist');

  if (!isOpen) return null;

  const currentArch = ARCHETYPES.find((a) => a.id === selectedArchId) || ARCHETYPES[0];

  const handleStartGame = () => {
    sound.playSuccess();

    const char: PlayerCharacter = {
      name: name.trim() || '島嶼漫遊者',
      title: '島嶼漫遊者',
      archetype: currentArch.name.split(' (')[0],
      stats: { ...currentArch.stats },
      vitals: {
        hp: 100 + (currentArch.stats.STR - 10) * 3,
        maxHp: 100 + (currentArch.stats.STR - 10) * 3,
        san: 100 + (currentArch.stats.INT - 10) * 3,
        maxSan: 100 + (currentArch.stats.INT - 10) * 3,
        stamina: 100,
        maxStamina: 100,
        twd: 1200,
        lv: 1,
        exp: 0,
        maxExp: 100,
      },
      currentDistrictId: 'wanhua_ximen',
      inventory: [...INITIAL_ITEMS],
      investigatedIncidents: [],
      solvedCount: 0,
      transitCount: 0,
      buffs: [],
      journal: [
        {
          timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
          text: `漫遊者 ${name} 抵達萬華西門町，隨身攜帶台鐵便當與道家符咒，正式展開島嶼地脈調查。`,
          type: 'explore',
        },
      ],
    };

    onComplete(char);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-[#0b101c] border-2 border-cyan-500/60 rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="text-center pb-4 border-b border-cyan-900/40">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-500/50 rounded-full text-xs text-cyan-300 font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>建立調查身分 // CHARACTER CREATION</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 glow-cyan">
            《台灣異聞錄：島嶼漫遊者》
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            「搭上最後一班車，穿梭於台灣鄉鎮之間的靈能與怪談世界。」
          </p>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5">
          
          {/* Character Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              漫遊者姓名 (Name)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="請輸入你的代號或姓名..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none rounded-lg text-sm text-slate-100 font-medium"
            />
          </div>

          {/* Archetype Choice */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              選擇調查身分專長 (Archetype)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ARCHETYPES.map((arch) => {
                const isSelected = selectedArchId === arch.id;

                return (
                  <div
                    key={arch.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedArchId(arch.id);
                    }}
                    className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/90 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-bold text-slate-100 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span>{arch.icon}</span>
                          <span>{arch.name.split(' (')[0]}</span>
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        {arch.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 grid grid-cols-4 gap-1 text-center font-mono text-[11px]">
                      <div className="bg-slate-950 p-1 rounded">
                        <span className="text-[9px] text-slate-500 block">力量</span>
                        <span className="font-bold text-slate-200">{arch.stats.STR}</span>
                      </div>
                      <div className="bg-slate-950 p-1 rounded">
                        <span className="text-[9px] text-slate-500 block">智力</span>
                        <span className="font-bold text-cyan-300">{arch.stats.INT}</span>
                      </div>
                      <div className="bg-slate-950 p-1 rounded">
                        <span className="text-[9px] text-slate-500 block">敏捷</span>
                        <span className="font-bold text-slate-200">{arch.stats.AGI}</span>
                      </div>
                      <div className="bg-slate-950 p-1 rounded">
                        <span className="text-[9px] text-slate-500 block">幸運</span>
                        <span className="font-bold text-amber-300">{arch.stats.LUK}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Starting Kit Preview */}
          <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-400">
            <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <span>初始攜帶裝備與資源:</span>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-300 mt-1.5">
              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">🍱 台鐵便當 x2</span>
              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">📜 符咒貼紙 x3</span>
              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">🧋 珍珠奶茶 x1</span>
              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">🧭 尋龍定盤 x1</span>
              <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800 rounded text-emerald-300 font-mono font-bold">$1,200 TWD</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={handleStartGame}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-slate-950 font-black text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            搭上最後一班車，展開調查
          </button>
        </div>

      </div>
    </div>
  );
};
