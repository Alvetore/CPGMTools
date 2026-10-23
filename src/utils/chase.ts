import { ChaseVehicle, CombatSpeed, SPEED_POSITIONING_DVS } from '../types/chase';
import { executeCPRCheck, ManualD10Input } from './dice';

export function getEffectiveSpeed(v: ChaseVehicle): { effectiveSpeed: CombatSpeed | 'crashed'; isHalved: boolean } {
  const tiers: CombatSpeed[] = [60,40,20,15,10,8];
  const isHalved = v.sdpCurrent < v.sdpMax / 2;
  const index = tiers.indexOf(v.speedCombat) + Number(isHalved) + Number(v.isPitSuffering);
  return { effectiveSpeed: index >= tiers.length ? 'crashed' : tiers[index], isHalved };
}

export function markEscapes(vehicles: ChaseVehicle[]): ChaseVehicle[] {
  const pursuers = vehicles.filter(v => v.side === 'pursuer' && !v.isWrecked && !v.isEscaped);
  return vehicles.map(v => ({ ...v, isEscaped: v.isEscaped || (v.side === 'evader' && !v.isWrecked && pursuers.length > 0 && pursuers.every(p => Math.abs(v.gridSquare - p.gridSquare) > 8)) }));
}

export function positionVehicle(v: ChaseVehicle, manual?: ManualD10Input) {
  if (v.isWrecked || v.isEscaped || v.positioned || v.needsControlResolution) return { vehicle: v };
  const { effectiveSpeed } = getEffectiveSpeed(v);
  if (effectiveSpeed === 'crashed') return { vehicle: { ...v, isWrecked: true, positioned: true } };
  const check = executeCPRCheck(v.driverBase, 0, 0, SPEED_POSITIONING_DVS[effectiveSpeed], manual);
  return { vehicle: { ...v, gridSquare: v.gridSquare + Number(check.isSuccess), positioned: true }, check };
}

export function finishChaseRound(vehicles: ChaseVehicle[], manual: Record<string, ManualD10Input> = {}) {
  const outcomes = vehicles.map(v => positionVehicle(v, manual[v.id]));
  return {
    vehicles: markEscapes(outcomes.map(({ vehicle: v }) => ({ ...v, isPitSuffering: false, isPulledClose: false, hasActed: false, positioned: false }))),
    outcomes,
  };
}
