import { Weapon } from '../types/character';

const magazineKey = (weapon: Weapon) => JSON.stringify([weapon.ammoType, weapon.magCapacity]);

// Keep owned weapons in their original order: combat spends ammo by this index.
// Legacy records without a readiness flag retain their previous behavior.
export const firstReadyWeaponIndex = (weapons: Weapon[]) => weapons.findIndex(w => w.isEquipped !== false);

export function manualWeaponReason(weapon: Weapon): string | undefined {
  if (weapon.consumable || /thrown grenade/i.test(weapon.category)) {
    return 'Гранаты и расходуемое оружие разрешайте вручную по описанию в чарнике: бросок/активация, расход, область и особые эффекты. Этот резолвер не применяет их автоматически.';
  }
  if (weapon.attackRequiresRoll === false || !weapon.damage) {
    return 'Спецэффект оружия разрешается вручную по описанию в чарнике. Обычный бросок атаки и урон не подставляются.';
  }
}

// The sheet exports the base weapon plus its selected profile and separate magazines.
// Keep that representation intact in party/combat/backup data.
export function selectedWeaponProfile(weapon: Weapon): Weapon {
  const profile = weapon.damageProfiles?.[weapon.selectedProfile ?? 0];
  if (!profile) return weapon;
  const selected = { ...weapon, ...profile, id: weapon.id, name: weapon.name,
    isEquipped: weapon.isEquipped, consumable: weapon.consumable, sourceCyberwareId: weapon.sourceCyberwareId };
  const ammo = magazineKey(selected) === magazineKey(weapon) ? weapon.currentAmmo : weapon.profileAmmo?.[magazineKey(selected)] ?? 0;
  return { ...selected, currentAmmo: Math.max(0, Math.min(ammo, selected.magCapacity)) };
}

export function spendWeaponAmmo(weapon: Weapon, amount: number): Weapon {
  if (weapon.isEquipped === false) return weapon;
  const selected = selectedWeaponProfile(weapon);
  const currentAmmo = Math.max(0, selected.currentAmmo - amount);
  return magazineKey(selected) === magazineKey(weapon)
    ? { ...weapon, currentAmmo }
    : { ...weapon, profileAmmo: { ...weapon.profileAmmo, [magazineKey(selected)]: currentAmmo } };
}
