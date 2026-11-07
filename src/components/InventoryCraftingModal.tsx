import React, { useState } from 'react';
import { Item, CraftingRecipe, PlayerCharacter } from '../types/game';
import { CRAFTING_RECIPES, ALL_ITEMS_CATALOG } from '../data/gameData';
import { sound } from '../utils/audio';
import { X, Package, Hammer, Sparkles, Check, AlertCircle } from 'lucide-react';

interface InventoryCraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerCharacter;
  onUseItem: (item: Item) => void;
  onCraftItem: (recipe: CraftingRecipe) => void;
}

export const InventoryCraftingModal: React.FC<InventoryCraftingModalProps> = ({
  isOpen,
  onClose,
  player,
  onUseItem,
  onCraftItem,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'crafting'>('inventory');
  const [craftSuccessMsg, setCraftSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const getItemCount = (itemId: string) => {
    const found = player.inventory.find((i) => i.id === itemId);
    return found ? found.quantity : 0;
  };

  const handleCraft = (recipe: CraftingRecipe) => {
    // Check ingredients
    const canCraft = recipe.ingredients.every((ing) => getItemCount(ing.itemId) >= ing.count);
    if (!canCraft) return;

    sound.playSuccess();
    onCraftItem(recipe);
    setCraftSuccessMsg(`成功鍛造合成：【${recipe.resultItemName}】！`);
    setTimeout(() => setCraftSuccessMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0b101c] border border-cyan-800/50 rounded-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-600/40 text-cyan-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">漫遊者行囊與秘術鍛造 (INVENTORY & CRAFTING)</h2>
              <p className="text-xs text-slate-400">管理在各鄉鎮採集到的民俗素材、護身符咒與在地糧草補給。</p>
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 pt-4">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('inventory');
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>行囊道具 ({player.inventory.reduce((a, b) => a + b.quantity, 0)})</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('crafting');
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'crafting'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Hammer className="w-4 h-4" />
            <span>秘術合成工坊 (Crafting Bench)</span>
          </button>
        </div>

        {/* Success Alert */}
        {craftSuccessMsg && (
          <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{craftSuccessMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4">
          {activeTab === 'inventory' ? (
            player.inventory.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500">
                行囊空空如也。可於各鄉鎮小吃店購買糧食，或調查都市怪談採集珍稀材料。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {player.inventory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span className="text-slate-100 flex items-center gap-1.5">
                          {item.type === 'consumable' && '🍱'}
                          {item.type === 'talisman' && '📜'}
                          {item.type === 'material' && '🧪'}
                          {item.type === 'curio' && '🧿'}
                          {item.name}
                        </span>
                        <span className="text-cyan-400 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          x{item.quantity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500">
                        {item.effects?.hp && <span className="text-rose-400 mr-2">HP +{item.effects.hp}</span>}
                        {item.effects?.san && <span className="text-cyan-400 mr-2">SAN +{item.effects.san}</span>}
                        {item.effects?.stamina && <span className="text-amber-400 mr-2">體力 +{item.effects.stamina}</span>}
                        {item.effects?.buffStat && (
                          <span className="text-purple-300">
                            {item.effects.buffStat} +{item.effects.buffAmount}
                          </span>
                        )}
                      </div>

                      {item.effects && (
                        <button
                          onClick={() => {
                            sound.playSuccess();
                            onUseItem(item);
                          }}
                          className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-600/50 text-cyan-300 font-bold rounded text-[11px] transition-colors cursor-pointer"
                        >
                          使用道具
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl text-xs text-purple-300 flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span>將不同縣市探訪獲得的靈脈特產調和熔煉，能製造出高階降魔道具與全面增益護符！</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {CRAFTING_RECIPES.map((recipe) => {
                  const hasAll = recipe.ingredients.every((ing) => getItemCount(ing.itemId) >= ing.count);
                  const meetsInt = player.stats.INT >= recipe.requiredInt;

                  return (
                    <div
                      key={recipe.id}
                      className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-bold mb-1">
                          <span className="text-sm text-slate-100">{recipe.resultItemName}</span>
                          <span className="text-[10px] text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            需求智力 INT ≥ {recipe.requiredInt}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                          {recipe.resultDescription}
                        </p>

                        {/* Ingredients */}
                        <div className="flex flex-wrap gap-2">
                          {recipe.ingredients.map((ing) => {
                            const current = getItemCount(ing.itemId);
                            const enough = current >= ing.count;

                            return (
                              <div
                                key={ing.itemId}
                                className={`px-2.5 py-1 rounded text-[11px] border flex items-center gap-1.5 ${
                                  enough
                                    ? 'bg-slate-950 border-emerald-800 text-emerald-300'
                                    : 'bg-slate-950 border-rose-950 text-slate-500'
                                }`}
                              >
                                <span>{ing.itemName}:</span>
                                <span className="font-mono font-bold">
                                  {current}/{ing.count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        <button
                          onClick={() => handleCraft(recipe)}
                          disabled={!hasAll || !meetsInt}
                          className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {!meetsInt ? '智力不足' : !hasAll ? '素材不足' : '立即合成'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
