export type CombatSpeed = 60 | 40 | 20 | 15 | 10 | 8;

export interface ChaseVehicle {
  id: string;
  name: string;
  vehicleType: 'Car' | 'Motorcycle' | 'Truck' | 'AV' | 'Custom';
  driverName: string;
  driverBase: number; // REF + Drive Land Vehicle / Pilot
  sdpCurrent: number; // ПСП (Пункты структурной прочности)
  sdpMax: number;
  armorSp: number; // ОС брони ТС
  speedCombat: CombatSpeed; // 60, 40, 20, 15, 10, 8 СКО
  gridSquare: number; // Unbounded relative coordinate; escape compares distance to pursuers.
  hasNos: boolean;
  isPitSuffering: boolean; // Suffering from PIT maneuver (-1 speed category)
  isPulledClose: boolean; // Pulled closer to target
  isEscaped: boolean;
  isWrecked: boolean;
  notes?: string;
  side?: 'pursuer' | 'evader';
  hasActed?: boolean;
  positioned?: boolean;
  needsControlResolution?: boolean;
}

export interface ChaseManeuver {
  id: string;
  nameRu: string;
  nameEn: string;
  dv: number;
  actionType: 'Standard';
  descriptionRu: string;
  requirementRu: string;
}

export const HOT_PURSUIT_RANGE_BANDS = [
  { square: 1, range: '0–6 м', description: 'В упор / Рядом бок о бок' },
  { square: 2, range: '7–12 м', description: 'Ближняя дистанция' },
  { square: 3, range: '13–25 м', description: 'Средняя дистанция' },
  { square: 4, range: '26–50 м', description: 'Дальняя дистанция' },
  { square: 5, range: '51–100 м', description: 'Сверхдальняя' },
  { square: 6, range: '101–200 м', description: 'Предельная дистанция города' },
  { square: 7, range: '201–400 м', description: 'На грани видимости' },
  { square: 8, range: '401–800 м', description: 'Критический отрыв (> 8 = Побег)' }
];

export const SPEED_POSITIONING_DVS: Record<CombatSpeed, number> = {
  60: 13,
  40: 15,
  20: 17,
  15: 21,
  10: 24,
  8: 29
};

export const HOT_PURSUIT_MANEUVERS: ChaseManeuver[] = [
  {
    id: 'm-nos',
    nameRu: 'Ускорение закисью азота (NOS)',
    nameEn: 'NOS Boost',
    dv: 13,
    actionType: 'Standard',
    descriptionRu: 'Автоматически перемещает ТС на +1 клетку вперед. Проверка со СЛ 13 нужна для того, чтобы удержать контроль при резком ускорении.',
    requirementRu: 'Наличие системы закиси азота (NOS) на ТС.'
  },
  {
    id: 'm-pit',
    nameRu: 'Полицейский манёвр PIT',
    nameEn: 'PIT Maneuver',
    dv: 15,
    actionType: 'Standard',
    descriptionRu: 'Оператор слегка толкает целевое ТС. В конце раунда цель выполняет проверку позиционирования, как если бы ее боевая скорость была на ступень ниже. Если скорость падает ниже 8 СКО — цель теряет управление и разбивается!',
    requirementRu: 'ТС находятся на соседних клетках сетки.'
  },
  {
    id: 'm-overtake',
    nameRu: 'Выход вперёд / Опережение',
    nameEn: 'Pull Ahead',
    dv: 17,
    actionType: 'Standard',
    descriptionRu: 'Оператор выжимает максимум и обходит целевое ТС, перемещаясь на 1 клетку вперед. При провале ТС теряет контроль или сталкивается со встречным препятствием.',
    requirementRu: 'ТС находятся на соседних клетках сетки.'
  },
  {
    id: 'm-pull-close',
    nameRu: 'Подтянуться ближе',
    nameEn: 'Pull Close',
    dv: 13,
    actionType: 'Standard',
    descriptionRu: 'Оператор смещает свое ТС к нижнему краю текущего диапазона (например, 7м вместо 12м) до конца раунда. Это открывает возможность для прыжков на ТС и ближнего боя.',
    requirementRu: 'Сближение с нижним краем текущего диапазона до конца раунда.'
  },
  {
    id: 'm-ram',
    nameRu: 'Таран',
    nameEn: 'Ramming',
    dv: 17,
    actionType: 'Standard',
    descriptionRu: 'Прямая попытка врезаться в целевое ТС на полной скорости, сохраняя управление. Наносит повреждения ПСП обоим ТС по правилам тарана (стр. 192).',
    requirementRu: 'ТС находятся на одной клетке.'
  }
];
