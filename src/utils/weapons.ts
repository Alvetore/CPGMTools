import { Weapon } from '../types/character';

const magazineKey = (weapon: Weapon) => JSON.stringify([weapon.ammoType, weapon.magCapacity]);

// The sheet exports the base weapon plus its selected profile and separate magazines.
// Keep that representation intact in party/combat/backup data.
export function selectedWeaponProfile(weapon: Weapon): Weapon {
  const profile = weapon.damageProfiles?.[weapon.selectedProfile ?? 0];
  if (!profile) return weapon;
  const selected = { ...weapon, ...profile, name: weapon.name };
  const ammo = magazineKey(selected) === magazineKey(weapon) ? weapon.currentAmmo : weapon.profileAmmo?.[magazineKey(selected)] ?? 0;
  return { ...selected, currentAmmo: Math.max(0, Math.min(ammo, selected.magCapacity)) };
}

export function spendWeaponAmmo(weapon: Weapon, amount: number): Weapon {
  const selected = selectedWeaponProfile(weapon);
  const currentAmmo = Math.max(0, selected.currentAmmo - amount);
  return magazineKey(selected) === magazineKey(weapon)
    ? { ...weapon, currentAmmo }
    : { ...weapon, profileAmmo: { ...weapon.profileAmmo, [magazineKey(selected)]: currentAmmo } };
}
