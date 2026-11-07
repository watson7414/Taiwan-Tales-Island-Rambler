import React, { useState, useEffect } from 'react';
import { District, Region, TransitType, TransitVehicle, PlayerCharacter } from '../types/game';
import { GAME_REGIONS, TRANSIT_VEHICLES, TRANSIT_INCIDENTS } from '../data/gameData';
import { sound } from '../utils/audio';
import { X, ArrowRight, ShieldAlert, AlertCircle } from 'lucide-react';

interface TransitModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerCharacter;
  currentDistrict: District;
  onConfirmTravel: (
    targetDistrict: District,
    vehicle: TransitVehicle,
    transitEncounter?: { title: string; text: string; reward?: string; penalty?: string; hp?: number; san?: number; stamina?: number; twd?: number; exp?: number }
  ) => void;
  defaultTargetDistrictId?: string;
}

export const TransitModal: React.FC<TransitModalProps> = ({
  isOpen,
  onClose,
  player,
  currentDistrict,
  onConfirmTravel,
  defaultTargetDistrictId,
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string>(currentDistrict.region === '北部地區' ? 'north' : 'central');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedVehicleType, setSelectedVehicleType] = useState<TransitType>('TRA');
  const [traveling, setTraveling] = useState(false);

  useEffect(() => {
    if (isOpen && defaultTargetDistrictId) {
      // Find matching district across regions
      for (const r of GAME_REGIONS) {
        for (const c of r.counties) {
          const match = c.districts.find((d) => d.id === defaultTargetDistrictId);
          if (match && match.id !== currentDistrict.id) {
            setSelectedRegionId(r.id);
            setSelectedDistrictId(match.id);
            // Pre-select appropriate vehicle
            if (match.region === '離島地區' || currentDistrict.region === '離島地區') {
              setSelectedVehicleType('FERRY');
            } else if (match.hasStation.thsr && currentDistrict.hasStation.thsr) {
              setSelectedVehicleType('THSR');
            } else if (match.hasStation.tra && currentDistrict.hasStation.tra) {
              setSelectedVehicleType('TRA');
            } else if (match.hasStation.bus) {
              setSelectedVehicleType('BUS');
            } else {
              setSelectedVehicleType('TAXI');
            }
            return;
          }
        }
      }
    }
  }, [isOpen, defaultTargetDistrictId, currentDistrict.id]);

  if (!isOpen) return null;

  // Flatten all districts
  const allDistricts: District[] = [];
  GAME_REGIONS.forEach((r) => {
    r.counties.forEach((c) => {
      c.districts.forEach((d) => allDistricts.push(d));
    });
  });

  const targetDistrict = allDistricts.find((d) => d.id === selectedDistrictId);
  const currentVehicle = TRANSIT_VEHICLES.find((v) => v.type === selectedVehicleType)!;

  // Check if travel involves outlying islands
  const involvesIsland = targetDistrict
    ? targetDistrict.region === '離島地區' || currentDistrict.region === '離島地區'
    : false;

  // Calculate actual fare based on vehicle and whether inter-region
  const isInterRegion = targetDistrict ? targetDistrict.region !== currentDistrict.region : false;
  let finalFare = currentVehicle.fareEstimate;
  if (currentVehicle.type === 'THSR' && !isInterRegion) {
    finalFare = 450; // Short THSR haul
  } else if (currentVehicle.type === 'THSR' && isInterRegion) {
    finalFare = 790;
  } else if (currentVehicle.type === 'TRA' && isInterRegion) {
    finalFare = 220;
  } else if (currentVehicle.type === 'TAXI' && isInterRegion) {
    finalFare = 650; // Taxi cross-county
  } else if (currentVehicle.type === 'FERRY') {
    finalFare = 520; // Maritime ferry/speedboat ticket
  }

  const canAffordMoney = player.vitals.twd >= finalFare;
  const canAffordStamina = player.vitals.stamina >= currentVehicle.staminaCost;

  // Station availability check: Strictly enforce that island travel can only use FERRY
  const isVehicleAvailable = targetDistrict
    ? involvesIsland
      ? currentVehicle.type === 'FERRY' // Only FERRY allowed for islands
      : currentVehicle.type === 'FERRY'
      ? false // Ferry is island-only
      : selectedVehicleType === 'THSR'
      ? targetDistrict.hasStation.thsr && currentDistrict.hasStation.thsr
      : selectedVehicleType === 'TRA'
      ? targetDistrict.hasStation.tra && currentDistrict.hasStation.tra
      : selectedVehicleType === 'BUS'
      ? targetDistrict.hasStation.bus
      : targetDistrict.hasStation.taxi
    : false;

  const handleStartTravel = () => {
    if (!targetDistrict || !canAffordMoney || !canAffordStamina || !isVehicleAvailable || traveling) return;

    setTraveling(true);
    if (currentVehicle.type === 'FERRY') {
      sound.playShipHorn();
    } else {
      sound.playTransit();
    }

    setTimeout(() => {
      // Roll for transit encounter
      let encounter = undefined;
      const roll = Math.random();
      if (roll < currentVehicle.incidentChance) {
        const picked = TRANSIT_INCIDENTS[Math.floor(Math.random() * TRANSIT_INCIDENTS.length)];
        encounter = picked;
      }

      setTraveling(false);
      onConfirmTravel(targetDistrict, { ...currentVehicle, fareEstimate: finalFare }, encounter);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0b101c] border border-cyan-700/50 rounded-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>全島交通轉運中心 (TRANSIT NETWORK)</span>
            </h2>
            <p className="text-xs text-slate-400">
              選擇目的地鄉鎮市區與交通工具，穿梭於全台 22 縣市靈脈之間。
            </p>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            disabled={traveling}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          
          {/* Step 1: Choose Target Region & District */}
          <div>
            <h3 className="text-xs font-bold text-cyan-400 tracking-wider mb-2">
              步驟 1：選擇前往的目的地區域與鄉鎮市區
            </h3>

            {/* Region Tabs */}
            <div className="flex flex-wrap gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 mb-3">
              {GAME_REGIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedRegionId(r.id);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    selectedRegionId === r.id
                      ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-500/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>

            {/* Districts List for Selected Region */}
            {(() => {
              const region = GAME_REGIONS.find((r) => r.id === selectedRegionId);
              if (!region) return null;

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {region.counties.flatMap((c) =>
                    c.districts.map((d) => {
                      const isCurrent = d.id === currentDistrict.id;
                      const isSelected = d.id === selectedDistrictId;

                      return (
                        <div
                          key={d.id}
                          onClick={() => {
                            if (!isCurrent) {
                              sound.playClick();
                              setSelectedDistrictId(d.id);
                              if (d.region === '離島地區' || currentDistrict.region === '離島地區') {
                                setSelectedVehicleType('FERRY');
                              } else if (selectedVehicleType === 'FERRY') {
                                setSelectedVehicleType('TRA');
                              }
                            }
                          }}
                          className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-slate-950/40 border-slate-800 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-cyan-950/80 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold mb-1">
                            <span className="text-slate-100">{d.name}</span>
                            {isCurrent ? (
                              <span className="text-[10px] text-cyan-400 font-mono">當前位置</span>
                            ) : (
                              <span className="text-[10px] text-rose-400 font-mono">Lv.{d.occultLevel} 異聞</span>
                            )}
                          </div>
                          <div className="text-[11px] text-amber-300/80 truncate mb-2">{d.landmark}</div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span>可搭:</span>
                            {d.hasStation.thsr && <span title="高鐵">🚅</span>}
                            {d.hasStation.tra && <span title="台鐵">🚆</span>}
                            {d.hasStation.bus && <span title="公路客運">🚌</span>}
                            {d.hasStation.taxi && <span title="小黃計程車">🚕</span>}
                            {d.hasStation.ferry && <span title="渡輪/快艇">⛴️</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })()}
          </div>

          {/* Step 2: Choose Transport Vehicle */}
          {targetDistrict && (
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-cyan-400 tracking-wider">
                  步驟 2：選擇交通工具 (TRANSIT VEHICLE)
                </h3>
                {involvesIsland && (
                  <span className="text-[11px] text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-600/60 font-semibold">
                    ⛴️ 離島航線限制：只能坐渡輪或快艇
                  </span>
                )}
              </div>

              {involvesIsland && (
                <div className="mb-3 p-2.5 bg-blue-950/50 border border-blue-500/40 rounded-xl text-xs text-blue-200 flex items-center gap-2">
                  <span className="text-base">⛴️</span>
                  <span>
                    【跨海交通管制】目的地或出發地包含離島地區（綠島、金門），所有陸路交通工具無法跨海，**只能搭乘渡輪或快艇**！
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {TRANSIT_VEHICLES.map((v) => {
                  const isSelected = selectedVehicleType === v.type;
                  
                  let availableForTarget = false;
                  let unavailReason = '兩地節點未通達此車種';

                  if (involvesIsland) {
                    if (v.type === 'FERRY') {
                      availableForTarget = true;
                    } else {
                      availableForTarget = false;
                      unavailReason = '離島地區跨海只能坐渡輪或快艇';
                    }
                  } else {
                    if (v.type === 'FERRY') {
                      availableForTarget = false;
                      unavailReason = '本島市區陸路請搭鐵路或客運';
                    } else if (v.type === 'THSR') {
                      availableForTarget = targetDistrict.hasStation.thsr && currentDistrict.hasStation.thsr;
                      if (!availableForTarget) unavailReason = '無高鐵車站共構';
                    } else if (v.type === 'TRA') {
                      availableForTarget = targetDistrict.hasStation.tra && currentDistrict.hasStation.tra;
                      if (!availableForTarget) unavailReason = '未通達台鐵鐵道';
                    } else if (v.type === 'BUS') {
                      availableForTarget = targetDistrict.hasStation.bus;
                      if (!availableForTarget) unavailReason = '無公路客運停靠';
                    } else {
                      availableForTarget = targetDistrict.hasStation.taxi;
                      if (!availableForTarget) unavailReason = '無計程車跨區服務';
                    }
                  }

                  let vehicleFare = v.fareEstimate;
                  if (v.type === 'THSR' && !isInterRegion) vehicleFare = 450;
                  if (v.type === 'THSR' && isInterRegion) vehicleFare = 790;
                  if (v.type === 'TRA' && isInterRegion) vehicleFare = 220;
                  if (v.type === 'TAXI' && isInterRegion) vehicleFare = 650;
                  if (v.type === 'FERRY') vehicleFare = 520;

                  return (
                    <div
                      key={v.type}
                      onClick={() => {
                        if (availableForTarget) {
                          sound.playClick();
                          setSelectedVehicleType(v.type);
                        }
                      }}
                      className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                        !availableForTarget
                          ? 'bg-slate-950/30 border-slate-800 opacity-40 cursor-not-allowed'
                          : isSelected
                          ? 'bg-cyan-950/90 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xl">{v.icon}</span>
                          <span className="font-bold text-slate-100">{v.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight mb-2">
                          {v.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">票價:</span>
                          <span className="text-emerald-400 font-bold">${vehicleFare}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">消耗體力:</span>
                          <span className="text-amber-400">-{v.staminaCost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">隨機事件率:</span>
                          <span className="text-cyan-400">{Math.round(v.incidentChance * 100)}%</span>
                        </div>
                        {!availableForTarget && (
                          <div className="text-rose-400 text-[10px] pt-1 leading-tight">
                            {unavailReason}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Travel Summary & Pre-Flight Check */}
          {targetDistrict && (
            <div className="bg-slate-950/90 border border-cyan-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="text-sm font-bold text-slate-200">
                  {currentDistrict.name}
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="text-sm font-bold text-cyan-300">
                  {targetDistrict.name}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  車資支出:{' '}
                  <span className={`font-bold ${canAffordMoney ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${finalFare} (現有 ${player.vitals.twd})
                  </span>
                </div>
                <div>
                  體力消耗:{' '}
                  <span className={`font-bold ${canAffordStamina ? 'text-amber-400' : 'text-rose-400'}`}>
                    -{currentVehicle.staminaCost} (現有 {player.vitals.stamina})
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {!targetDistrict ? (
              <span>請先點擊選擇欲前往的目的地。</span>
            ) : !isVehicleAvailable ? (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                所選交通工具在當前路線不可行，請更換交通工具。
              </span>
            ) : !canAffordMoney ? (
              <span className="text-rose-400">台幣不足，無法支付車資！請先調查本地事件賺取酬勞。</span>
            ) : !canAffordStamina ? (
              <span className="text-rose-400">移動體力不足！請先在在地旅館休息恢復體能。</span>
            ) : (
              <span className="text-cyan-400">一切就緒，準備啟程！</span>
            )}
          </div>

          <button
            onClick={handleStartTravel}
            disabled={!targetDistrict || !isVehicleAvailable || !canAffordMoney || !canAffordStamina || traveling}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {traveling
              ? currentVehicle.type === 'FERRY'
                ? '快艇破浪啟航中...'
                : '列車穿梭地脈中...'
              : involvesIsland
              ? '搭乘渡輪/快艇跨海啟程'
              : '出發前往新節點'}
          </button>
        </div>

      </div>
    </div>
  );
};
