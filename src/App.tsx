/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PlayerCharacter, District, Incident, IncidentChoice, TransitVehicle, Item, CraftingRecipe } from './types/game';
import { GAME_REGIONS } from './data/gameData';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { IncidentView } from './components/IncidentView';
import { TaiwanLeylineMap } from './components/TaiwanLeylineMap';
import { DiceRollModal } from './components/DiceRollModal';
import { TransitModal } from './components/TransitModal';
import { InventoryCraftingModal } from './components/InventoryCraftingModal';
import { SaveLoadModal } from './components/SaveLoadModal';
import { InnRestModal } from './components/InnRestModal';
import { GeminiDivinationModal } from './components/GeminiDivinationModal';
import { CharacterCreateModal } from './components/CharacterCreateModal';
import { generateChecksum } from './utils/crypto';
import { sound } from './utils/audio';
import { Skull, RefreshCw, AlertTriangle, CheckCircle, Compass, Radio } from 'lucide-react';

const AUTOSAVE_STORAGE_KEY = 'TW_ISLAND_RAMBLER_SLOT_0';
const SETTINGS_CRT_KEY = 'TW_ISLAND_RAMBLER_CRT';
const SETTINGS_SOUND_KEY = 'TW_ISLAND_RAMBLER_SOUND';

export default function App() {
  const [player, setPlayer] = useState<PlayerCharacter | null>(null);
  const [isCharacterCreating, setIsCharacterCreating] = useState(false);

  // Settings
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isTransitOpen, setIsTransitOpen] = useState(false);
  const [transitTargetDistrictId, setTransitTargetDistrictId] = useState<string>('');
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isInnOpen, setIsInnOpen] = useState(false);
  const [isDivinationOpen, setIsDivinationOpen] = useState(false);

  // Active Dice Roll State
  const [diceState, setDiceState] = useState<{
    incident: Incident;
    choice: IncidentChoice;
  } | null>(null);

  // Notice Banner (e.g. transit encounter, level up)
  const [notice, setNotice] = useState<{ title: string; text: string; type: 'success' | 'warn' | 'info' } | null>(null);

  // Flatten all districts for lookup
  const allDistricts: District[] = [];
  GAME_REGIONS.forEach((r) => {
    r.counties.forEach((c) => {
      c.districts.forEach((d) => allDistricts.push(d));
    });
  });

  const getDistrict = (id: string): District => {
    return allDistricts.find((d) => d.id === id) || allDistricts[0];
  };

  // Initial load
  useEffect(() => {
    // Load Settings
    const savedCrt = localStorage.getItem(SETTINGS_CRT_KEY);
    if (savedCrt !== null) setCrtEnabled(savedCrt === 'true');

    const savedSound = localStorage.getItem(SETTINGS_SOUND_KEY);
    if (savedSound !== null) {
      const isSnd = savedSound === 'true';
      setSoundEnabled(isSnd);
      sound.enabled = isSnd;
    }

    // Load AutoSave or prompt character creation
    const autoSaveRaw = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
    if (autoSaveRaw) {
      try {
        const parsed = JSON.parse(autoSaveRaw);
        if (parsed?.player) {
          setPlayer(parsed.player);
          return;
        }
      } catch {
        // Fallback to creation
      }
    }

    // If no save, prompt creation
    setIsCharacterCreating(true);
  }, []);

  // Autosave helper
  const performAutosave = async (updatedPlayer: PlayerCharacter) => {
    try {
      const checksum = await generateChecksum(updatedPlayer);
      const data = {
        slot: 0,
        timestamp: new Date().toLocaleString('zh-TW', { hour12: false }),
        player: updatedPlayer,
        checksum,
        isAutosave: true,
      };
      localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Autosave error:', e);
    }
  };

  const showNotification = (title: string, text: string, type: 'success' | 'warn' | 'info' = 'info') => {
    setNotice({ title, text, type });
    setTimeout(() => setNotice(null), 5000);
  };

  // Level Up Check
  const checkLevelUp = (p: PlayerCharacter): PlayerCharacter => {
    if (p.vitals.exp >= p.vitals.maxExp) {
      const newLv = p.vitals.lv + 1;
      const leftoverExp = p.vitals.exp - p.vitals.maxExp;
      const newMaxExp = Math.round(p.vitals.maxExp * 1.5);
      const newMaxHp = p.vitals.maxHp + 10;
      const newMaxSan = p.vitals.maxSan + 10;

      sound.playCriticalSuccess();
      showNotification(
        `🎉 升等突破！達到等級 Lv.${newLv}`,
        `全方位體質大幅增強！生命上限 +10, 理智上限 +10, 狀態全面回滿！`,
        'success'
      );

      return {
        ...p,
        vitals: {
          ...p.vitals,
          lv: newLv,
          exp: leftoverExp,
          maxExp: newMaxExp,
          maxHp: newMaxHp,
          hp: newMaxHp,
          maxSan: newMaxSan,
          san: newMaxSan,
          stamina: p.vitals.maxStamina,
        },
        journal: [
          ...p.journal,
          {
            timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
            text: `【升等榮耀】突破至等級 Lv.${newLv}，靈能威壓大幅提升！`,
            type: 'explore',
          },
        ],
      };
    }
    return p;
  };

  // Choice Selection
  const handleSelectChoice = (incident: Incident, choice: IncidentChoice) => {
    if (!player) return;

    if (choice.autoSuccess) {
      // Direct pass without roll
      handleCheckComplete(true, 20, 20, false, false, incident, choice);
    } else if (choice.statCheck) {
      setDiceState({ incident, choice });
    }
  };

  // D20 Check Completion
  const handleCheckComplete = (
    success: boolean,
    roll: number,
    total: number,
    isNat20: boolean,
    isNat1: boolean,
    targetIncident?: Incident,
    targetChoice?: IncidentChoice,
    wasQteEvaded?: boolean
  ) => {
    if (!player) return;
    const inc = targetIncident || diceState?.incident;
    const choice = targetChoice || diceState?.choice;
    if (!inc || !choice) return;

    setDiceState(null);

    let updated = { ...player };

    if (success) {
      const reward = choice.successReward;
      let newExp = updated.vitals.exp + reward.exp;
      let newTwd = updated.vitals.twd + (reward.twd || 0);
      let newSan = Math.min(updated.vitals.maxSan, updated.vitals.san + (reward.san || 0));
      let newHp = Math.min(updated.vitals.maxHp, updated.vitals.hp + (reward.hp || 0));
      let newStamina = Math.min(updated.vitals.maxStamina, updated.vitals.stamina + (reward.stamina || 0));

      // Items reward
      let newInventory = [...updated.inventory];
      if (reward.items && reward.items.length > 0) {
        reward.items.forEach((rwItem) => {
          const existing = newInventory.find((i) => i.id === rwItem.id);
          if (existing) {
            existing.quantity += rwItem.quantity;
          } else {
            newInventory.push({
              id: rwItem.id,
              name: rwItem.name,
              type: 'material',
              description: '調查異聞獲得之在地珍稀靈物。',
              value: 150,
              quantity: rwItem.quantity,
            });
          }
        });
      }

      const isFirstSolve = !updated.investigatedIncidents.includes(inc.id);

      updated = {
        ...updated,
        vitals: {
          ...updated.vitals,
          exp: newExp,
          twd: newTwd,
          san: newSan,
          hp: newHp,
          stamina: newStamina,
        },
        inventory: newInventory,
        investigatedIncidents: isFirstSolve
          ? [...updated.investigatedIncidents, inc.id]
          : updated.investigatedIncidents,
        solvedCount: isFirstSolve ? updated.solvedCount + 1 : updated.solvedCount,
        journal: [
          ...updated.journal,
          {
            timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
            text: wasQteEvaded
              ? `【QTE 極限反應迴避成功】${inc.title}: 雖擲骰未達標，但在生死瞬間觸發 QTE 成功反制！迴避了失敗懲罰 (EXP +${reward.exp})！`
              : `【檢定成功】${inc.title}: ${choice.successText} (EXP +${reward.exp}${reward.twd ? `, $${reward.twd}` : ''})`,
            type: 'check',
          },
        ],
      };

      showNotification(
        wasQteEvaded ? '⚡ QTE 反應成功！' : '檢定通過！',
        wasQteEvaded ? '千鈞一髮迴避失敗，化險為夷推進劇情！' : choice.successText,
        'success'
      );
    } else {
      const penalty = choice.failurePenalty;
      const penaltyHp = penalty?.hp || 10;
      const penaltySan = penalty?.san || 10;

      const newHp = Math.max(0, updated.vitals.hp - penaltyHp);
      const newSan = Math.max(0, updated.vitals.san - penaltySan);

      updated = {
        ...updated,
        vitals: {
          ...updated.vitals,
          hp: newHp,
          san: newSan,
        },
        journal: [
          ...updated.journal,
          {
            timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
            text: `【檢定失敗】${inc.title}: ${choice.failureText || '行動失利'} (HP -${penaltyHp}, SAN -${penaltySan})`,
            type: 'check',
          },
        ],
      };

      showNotification('檢定挫敗！', choice.failureText || '遭受靈能反噬！', 'warn');
    }

    // Decrement buff turns
    if (updated.buffs.length > 0) {
      updated.buffs = updated.buffs
        .map((b) => ({ ...b, turnsRemaining: b.turnsRemaining - 1 }))
        .filter((b) => b.turnsRemaining > 0);
    }

    updated = checkLevelUp(updated);
    setPlayer(updated);
    performAutosave(updated);
  };

  // Travel Handler
  const handleConfirmTravel = (
    targetDistrict: District,
    vehicle: TransitVehicle,
    transitEncounter?: any
  ) => {
    if (!player) return;

    let updated = { ...player };
    const newTwd = Math.max(0, updated.vitals.twd - vehicle.fareEstimate);
    const newStamina = Math.max(0, updated.vitals.stamina - vehicle.staminaCost);

    let encounterLog = `搭乘【${vehicle.name}】抵達【${targetDistrict.name}】(車資 -$${vehicle.fareEstimate}, 體力 -${vehicle.staminaCost})。`;

    let hpChange = 0;
    let sanChange = 0;
    let staminaChange = 0;

    if (transitEncounter) {
      if (transitEncounter.hp) hpChange += transitEncounter.hp;
      if (transitEncounter.san) sanChange += transitEncounter.san;
      if (transitEncounter.stamina) staminaChange += transitEncounter.stamina;
      if (transitEncounter.cost) updated.vitals.twd = Math.max(0, updated.vitals.twd - transitEncounter.cost);
      if (transitEncounter.exp) updated.vitals.exp += transitEncounter.exp;

      encounterLog += ` 途中遭遇：${transitEncounter.title} - ${transitEncounter.reward || transitEncounter.penalty || ''}`;
      showNotification('旅途隨機異象', `${transitEncounter.title}: ${transitEncounter.text}`, 'info');
    }

    updated = {
      ...updated,
      currentDistrictId: targetDistrict.id,
      transitCount: updated.transitCount + 1,
      vitals: {
        ...updated.vitals,
        twd: newTwd,
        stamina: Math.max(0, Math.min(updated.vitals.maxStamina, newStamina + staminaChange)),
        hp: Math.max(0, Math.min(updated.vitals.maxHp, updated.vitals.hp + hpChange)),
        san: Math.max(0, Math.min(updated.vitals.maxSan, updated.vitals.san + sanChange)),
      },
      journal: [
        ...updated.journal,
        {
          timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
          text: encounterLog,
          type: 'travel',
        },
      ],
    };

    updated = checkLevelUp(updated);
    setPlayer(updated);
    performAutosave(updated);
    setIsTransitOpen(false);
  };

  // Use Item
  const handleUseItem = (item: Item) => {
    if (!player) return;

    let updated = { ...player };
    const idx = updated.inventory.findIndex((i) => i.id === item.id);
    if (idx < 0) return;

    if (updated.inventory[idx].quantity > 1) {
      updated.inventory[idx].quantity -= 1;
    } else {
      updated.inventory.splice(idx, 1);
    }

    if (item.effects) {
      if (item.effects.hp) {
        updated.vitals.hp = Math.min(updated.vitals.maxHp, updated.vitals.hp + item.effects.hp);
      }
      if (item.effects.san) {
        updated.vitals.san = Math.min(updated.vitals.maxSan, updated.vitals.san + item.effects.san);
      }
      if (item.effects.stamina) {
        updated.vitals.stamina = Math.min(updated.vitals.maxStamina, updated.vitals.stamina + item.effects.stamina);
      }
      if (item.effects.buffStat && item.effects.buffAmount) {
        updated.buffs = [
          ...updated.buffs.filter((b) => b.stat !== item.effects!.buffStat),
          {
            stat: item.effects.buffStat,
            amount: item.effects.buffAmount,
            turnsRemaining: item.effects.buffDurationTurns || 3,
          },
        ];
      }
    }

    updated.journal = [
      ...updated.journal,
      {
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        text: `使用道具【${item.name}】恢復狀態。`,
        type: 'explore',
      },
    ];

    setPlayer(updated);
    performAutosave(updated);
    showNotification('道具生效', `使用了【${item.name}】！`, 'success');
  };

  // Craft Item
  const handleCraftItem = (recipe: CraftingRecipe) => {
    if (!player) return;

    let updated = { ...player };

    // Deduct ingredients
    recipe.ingredients.forEach((ing) => {
      const idx = updated.inventory.findIndex((i) => i.id === ing.itemId);
      if (idx >= 0) {
        if (updated.inventory[idx].quantity > ing.count) {
          updated.inventory[idx].quantity -= ing.count;
        } else {
          updated.inventory.splice(idx, 1);
        }
      }
    });

    // Add crafted item
    const existing = updated.inventory.find((i) => i.id === recipe.resultItemId);
    if (existing) {
      existing.quantity += 1;
    } else {
      updated.inventory.push({
        id: recipe.resultItemId,
        name: recipe.resultItemName,
        type: 'talisman',
        description: recipe.resultDescription,
        value: 500,
        quantity: 1,
        effects: { hp: 40, san: 40, buffStat: 'INT', buffAmount: 3, buffDurationTurns: 5 },
      });
    }

    updated.vitals.exp += 30;
    updated.journal = [
      ...updated.journal,
      {
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        text: `【秘術合成】成功鍛造出【${recipe.resultItemName}】(EXP +30)！`,
        type: 'craft',
      },
    ];

    updated = checkLevelUp(updated);
    setPlayer(updated);
    performAutosave(updated);
  };

  // Rest in Inn
  const handleRestInInn = (cost: number) => {
    if (!player) return;

    let updated = { ...player };
    updated.vitals.twd = Math.max(0, updated.vitals.twd - cost);
    updated.vitals.stamina = updated.vitals.maxStamina;
    updated.vitals.hp = Math.min(updated.vitals.maxHp, updated.vitals.hp + 50);
    updated.vitals.san = Math.min(updated.vitals.maxSan, updated.vitals.san + 40);

    updated.journal = [
      ...updated.journal,
      {
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        text: `在在地客棧休整一晚，體力全滿，傷勢與心神獲得治療 (花費 $${cost})。`,
        type: 'rest',
      },
    ];

    setPlayer(updated);
    performAutosave(updated);
    showNotification('休整完畢', '體力已完全回滿，傷勢與理智大幅好轉！', 'success');
  };

  // Buy Shop Item
  const handleBuyShopItem = (item: any) => {
    if (!player || player.vitals.twd < item.value) return;

    let updated = { ...player };
    updated.vitals.twd -= item.value;

    const existing = updated.inventory.find((i) => i.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      updated.inventory.push({ ...item, quantity: 1 });
    }

    updated.journal = [
      ...updated.journal,
      {
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        text: `在街頭攤販購買【${item.name}】一份 (花費 $${item.value})。`,
        type: 'explore',
      },
    ];

    setPlayer(updated);
    performAutosave(updated);
    showNotification('交易成功', `購買了【${item.name}】！`, 'success');
  };

  // Divination Blessing
  const handleReceiveBlessing = (stat: 'STR' | 'INT' | 'AGI' | 'LUK', omen: string) => {
    if (!player) return;

    let updated = { ...player };
    updated.vitals.san = Math.min(updated.vitals.maxSan, updated.vitals.san + 15);
    updated.buffs = [
      ...updated.buffs.filter((b) => b.stat !== stat),
      { stat, amount: 2, turnsRemaining: 4 },
    ];

    updated.journal = [
      ...updated.journal,
      {
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        text: `【地脈共振】領受天機卦象【${omen}】，獲得 ${stat} +2 靈能庇護！`,
        type: 'explore',
      },
    ];

    setPlayer(updated);
    performAutosave(updated);
    showNotification('領受靈能庇護', `卦象【${omen}】：${stat} 屬性提升 +2 (持續4回合)！`, 'success');
  };

  const handleRestartGame = () => {
    localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
    setPlayer(null);
    setIsCharacterCreating(true);
  };

  // Game Over Condition
  const isGameOver = player ? player.vitals.hp <= 0 : false;
  const isInsane = player ? player.vitals.san <= 0 : false;
  const isCriticalHp = player ? player.vitals.hp < 30 && player.vitals.hp > 0 : false;

  const currentDistrict = player ? getDistrict(player.currentDistrictId) : allDistricts[0];

  return (
    <div
      className={`min-h-screen bg-[#070a12] text-slate-100 flex flex-col relative ${
        crtEnabled ? 'crt-overlay crt-vignette' : ''
      }`}
    >
      {/* Critical Low HP (< 30) Red Flashing Screen Overlay */}
      {isCriticalHp && <div className="critical-hp-overlay" />}

      {/* Top Header */}
      <Header
        crtEnabled={crtEnabled}
        onToggleCrt={() => {
          const next = !crtEnabled;
          setCrtEnabled(next);
          localStorage.setItem(SETTINGS_CRT_KEY, String(next));
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          sound.enabled = next;
          localStorage.setItem(SETTINGS_SOUND_KEY, String(next));
        }}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
        onOpenMap={() => setIsMapOpen(!isMapOpen)}
        isMapOpen={isMapOpen}
        onRestartGame={handleRestartGame}
        currentDistrictName={currentDistrict.name}
      />

      {/* Notice Banner */}
      {notice && (
        <div
          className={`sticky top-14 z-30 px-4 py-2.5 text-xs flex items-center justify-between border-b backdrop-blur-md shadow-md animate-fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
              : notice.type === 'warn'
              ? 'bg-rose-950/90 border-rose-500/60 text-rose-200'
              : 'bg-cyan-950/90 border-cyan-500/60 text-cyan-200'
          }`}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              {notice.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="font-bold">{notice.title}:</span>
              <span>{notice.text}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {player && !isGameOver && !isInsane ? (
        <>
          {/* Stats & Vitals Bar */}
          <StatsBar
            player={player}
            onOpenInventory={() => setIsInventoryOpen(true)}
            onOpenDivination={() => setIsDivinationOpen(true)}
            onOpenInn={() => setIsInnOpen(true)}
            onOpenTransit={() => setIsTransitOpen(true)}
            onOpenMap={() => setIsMapOpen(!isMapOpen)}
            isMapOpen={isMapOpen}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Critical Low HP (< 30) Warning Banner */}
            {isCriticalHp && (
              <div className="p-3.5 bg-rose-950/90 border-2 border-rose-500 rounded-xl text-xs text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span className="font-semibold leading-relaxed">
                    【生命垂危警報】當前血量不到 30 (HP: {player.vitals.hp}/{player.vitals.maxHp})！全螢幕開始閃爍紅燈警告，請儘速使用台鐵便當、極陽烈酒或至旅店休整避難！
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsInventoryOpen(true)}
                    className="px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white rounded font-bold text-xs shadow cursor-pointer whitespace-nowrap"
                  >
                    打開行囊補血
                  </button>
                  <button
                    onClick={() => setIsInnOpen(true)}
                    className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-500/60 text-amber-300 rounded font-bold text-xs cursor-pointer whitespace-nowrap"
                  >
                    客棧休整
                  </button>
                </div>
              </div>
            )}

            {/* Low SAN Warning Banner */}
            {player.vitals.san <= 25 && (
              <div className="p-3 bg-purple-950/80 border border-purple-500/60 rounded-xl text-xs text-purple-300 flex items-center gap-2 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  【理智警報】當前理智值極低 (SAN ≤ 25)！幻象叢生，檢定時容易精神錯亂。請儘速前往在地客棧休整或飲用珍珠奶茶安神！
                </span>
              </div>
            )}

            {/* Tactical Leyline Map quick drawer or main district view */}
            {isMapOpen ? (
              <TaiwanLeylineMap
                currentDistrictId={player.currentDistrictId}
                onSelectDistrict={(d) => {
                  setIsMapOpen(false);
                  if (d.id !== player.currentDistrictId) {
                    setTransitTargetDistrictId(d.id);
                  }
                  setIsTransitOpen(true);
                }}
                onClose={() => setIsMapOpen(false)}
              />
            ) : (
              <IncidentView
                district={currentDistrict}
                player={player}
                onSelectChoice={handleSelectChoice}
                onBuyItem={handleBuyShopItem}
              />
            )}
          </main>
        </>
      ) : isGameOver || isInsane ? (
        /* Game Over View */
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-950 border-2 border-rose-600 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.4)]">
            <Skull className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-black text-rose-400 glow-crimson mb-2">
              {isGameOver ? '漫遊者身亡 (GAME OVER)' : '理智崩潰 · 迷失於幽冥 (INSANITY)'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto mb-6">
              {isGameOver
                ? '你的生命值已歸零，島嶼的靈能裂隙將你的殘留氣息吞噬。請從最近的手動存檔重整旗鼓，或重新啟程。'
                : '你的理智值已耗盡，無法承受不可名狀之怪談侵蝕，神智迷失在島嶼的地脈深處……'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                讀取先前存檔
              </button>
              <button
                onClick={handleRestartGame}
                className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all cursor-pointer"
              >
                重新開始遊戲
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modals */}
      {isCharacterCreating && (
        <CharacterCreateModal
          isOpen={isCharacterCreating}
          onComplete={(newChar) => {
            setPlayer(newChar);
            setIsCharacterCreating(false);
            performAutosave(newChar);
          }}
        />
      )}

      {player && (
        <>
          <TransitModal
            isOpen={isTransitOpen}
            onClose={() => {
              setIsTransitOpen(false);
              setTransitTargetDistrictId('');
            }}
            player={player}
            currentDistrict={currentDistrict}
            onConfirmTravel={(targetDistrict, vehicle, transitEncounter) => {
              setTransitTargetDistrictId('');
              handleConfirmTravel(targetDistrict, vehicle, transitEncounter);
            }}
            defaultTargetDistrictId={transitTargetDistrictId}
          />

          <InventoryCraftingModal
            isOpen={isInventoryOpen}
            onClose={() => setIsInventoryOpen(false)}
            player={player}
            onUseItem={handleUseItem}
            onCraftItem={handleCraftItem}
          />

          <SaveLoadModal
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            player={player}
            onLoadPlayer={(loaded) => setPlayer(loaded)}
          />

          <InnRestModal
            isOpen={isInnOpen}
            onClose={() => setIsInnOpen(false)}
            district={currentDistrict}
            player={player}
            onRest={handleRestInInn}
          />

          <GeminiDivinationModal
            isOpen={isDivinationOpen}
            onClose={() => setIsDivinationOpen(false)}
            district={currentDistrict}
            player={player}
            onReceiveBlessing={handleReceiveBlessing}
          />

          {diceState && (
            <DiceRollModal
              isOpen={!!diceState}
              stat={diceState.choice.statCheck!.stat}
              statName={
                diceState.choice.statCheck!.stat === 'STR'
                  ? '力量'
                  : diceState.choice.statCheck!.stat === 'INT'
                  ? '智力'
                  : diceState.choice.statCheck!.stat === 'AGI'
                  ? '敏捷'
                  : '幸運'
              }
              statValue={player.stats[diceState.choice.statCheck!.stat]}
              statModifier={Math.floor(
                (player.stats[diceState.choice.statCheck!.stat] +
                  (player.buffs.find((b) => b.stat === diceState.choice.statCheck!.stat)?.amount || 0) -
                  10) /
                  2
              )}
              dc={diceState.choice.statCheck!.dc}
              actionText={diceState.choice.text}
              onComplete={(success, roll, total, isNat20, isNat1, wasQteEvaded) =>
                handleCheckComplete(success, roll, total, isNat20, isNat1, undefined, undefined, wasQteEvaded)
              }
              onCancel={() => setDiceState(null)}
            />
          )}
        </>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-[#060810] px-4 py-3 text-center text-[11px] text-slate-500">
        《台灣異聞錄：島嶼漫遊者》· Web TRPG Engine · 賽博龐克在地都市怪談 · 22 縣市靈脈調查錄
      </footer>
    </div>
  );
}
