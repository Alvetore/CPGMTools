import { NpcTemplate } from '../types/bestiary';

export const OFFICIAL_CPR_BESTIARY: NpcTemplate[] = [
  {
    id: 'cpr-mook-bodyguard',
    nameRu: 'Телохранитель (Bodyguard)',
    nameEn: 'Bodyguard',
    threatLevel: 'Mook',
    faction: 'Охранное агентство / Корпорация',
    description: 'Наёмный охранник в кевларовом костюме. Задача — прикрывать важную шишку своим телом.',
    stats: { INT: 3, REF: 6, DEX: 5, TECH: 2, COOL: 4, WILL: 4, LUCK: 0, MOVE: 4, BODY: 6, EMP: 3 },
    hpMax: 35,
    headSp: 7,
    bodySp: 7,
    armorName: 'Кевлар (Кевларовый костюм)',
    weapons: [
      {
        id: 'w-bg-shotgun',
        name: 'Дробовик (Низкого кач-ва)',
        category: 'Shotgun',
        damage: '5d6',
        standardRof: 1,
        magCapacity: 4,
        currentAmmo: 4,
        ammoType: 'Жаканы (Slugs)',
        quality: 'Poor'
      },
      {
        id: 'w-bg-vhp',
        name: 'Очень тяжёлый пистолет',
        category: 'Very Heavy Pistol',
        damage: '4d6',
        standardRof: 1,
        magCapacity: 8,
        currentAmmo: 8,
        ammoType: 'Тяжелые пистолетные'
      }
    ],
    skills: [
      { nameRu: 'Драка', base: 11 },
      { nameRu: 'Длинноствольное оружие', base: 10 },
      { nameRu: 'Короткоствольное оружие', base: 10 },
      { nameRu: 'Атлетика', base: 9 },
      { nameRu: 'Восприятие', base: 9 },
      { nameRu: 'Выносливость', base: 9 },
      { nameRu: 'Уклонение', base: 7 }
    ],
    cyberware: ['Встроенная рация'],
    gear: ['Жаканы x25', 'Пистолетные патроны x25', 'Агент (смартфон)'],
    tactics: 'Занимает позицию между целью и атакующими. Стреляет из дробовика на дистанции до 12м, затем переходит на драку.'
  },
  {
    id: 'cpr-mook-road-ganger',
    nameRu: 'Дорожный бандит (Road Ganger)',
    nameEn: 'Road Ganger',
    threatLevel: 'Mook',
    faction: 'Кочевники-рейдеры / Пустоши',
    description: 'Бандит пустошей на тюнингованном багги или байке. Предпочитает нападать стаей.',
    stats: { INT: 4, REF: 6, DEX: 5, TECH: 4, COOL: 3, WILL: 3, LUCK: 0, MOVE: 3, BODY: 3, EMP: 3 },
    hpMax: 25,
    headSp: 4,
    bodySp: 4,
    armorName: 'Кожаная броня (Leather)',
    weapons: [
      {
        id: 'w-rg-vhp',
        name: 'Очень тяжёлый пистолет (Ржавый)',
        category: 'Very Heavy Pistol',
        damage: '4d6',
        standardRof: 1,
        magCapacity: 8,
        currentAmmo: 8,
        ammoType: 'Тяжелые пистолетные'
      },
      {
        id: 'w-rg-crossbow',
        name: 'Арбалет',
        category: 'Crossbow',
        damage: '4d6',
        standardRof: 1,
        magCapacity: 1,
        currentAmmo: 1,
        ammoType: 'Болты'
      },
      {
        id: 'w-rg-melee',
        name: 'Лёгкое холодное оружие (Заточка)',
        category: 'Light Melee',
        damage: '1d6',
        standardRof: 2,
        magCapacity: 1,
        currentAmmo: 1,
        ammoType: 'Melee'
      }
    ],
    skills: [
      { nameRu: 'Вождение наземного транспорта', base: 12 },
      { nameRu: 'Автомеханика', base: 10 },
      { nameRu: 'Короткоствольное оружие', base: 10 },
      { nameRu: 'Луки и арбалеты', base: 10 },
      { nameRu: 'Скрытность', base: 8 },
      { nameRu: 'Уклонение', base: 6 }
    ],
    cyberware: [],
    gear: ['Ремнабор', 'Болты для арбалета x10', 'Канистра с биотопливом'],
    tactics: 'Держится на ходу на транспорте. При потере транспорта пытается укрыться за обломками.'
  },
  {
    id: 'cpr-mook-security-guard',
    nameRu: 'Офицер службы безопасности (Security Officer)',
    nameEn: 'Security Officer',
    threatLevel: 'Mook',
    faction: 'Корпоративная СБ / Arasaka / Militech Guard',
    description: 'Дисциплинированный боец корпоративной охраны в легком арморджеке.',
    stats: { INT: 4, REF: 6, DEX: 6, TECH: 3, COOL: 5, WILL: 4, LUCK: 0, MOVE: 4, BODY: 7, EMP: 4 },
    hpMax: 40,
    headSp: 11,
    bodySp: 11,
    armorName: 'Лёгкий арморджек (Light Armorjack)',
    weapons: [
      {
        id: 'w-sec-ar',
        name: 'Штурмовая винтовка',
        category: 'Assault Rifle',
        damage: '5d6',
        standardRof: 1,
        magCapacity: 30,
        currentAmmo: 30,
        ammoType: 'Винтовочные'
      },
      {
        id: 'w-sec-hp',
        name: 'Тяжёлый пистолет',
        category: 'Heavy Pistol',
        damage: '3d6',
        standardRof: 2,
        magCapacity: 12,
        currentAmmo: 12,
        ammoType: 'Пистолетные'
      },
      {
        id: 'w-sec-baton',
        name: 'Электрошоковая дубинка (Heavy Melee)',
        category: 'Heavy Melee',
        damage: '3d6',
        standardRof: 2,
        magCapacity: 1,
        currentAmmo: 1,
        ammoType: 'Melee'
      }
    ],
    skills: [
      { nameRu: 'Длинноствольное оружие', base: 11 },
      { nameRu: 'Короткоствольное оружие', base: 10 },
      { nameRu: 'Холодное оружие', base: 10 },
      { nameRu: 'Атлетика', base: 9 },
      { nameRu: 'Восприятие', base: 9 },
      { nameRu: 'Уклонение', base: 8 }
    ],
    cyberware: ['Встроенный зашифрованный коммлинк'],
    gear: ['Наручники x2', 'Светошумовая граната', 'Запасной магазин к винтовке x2'],
    tactics: 'Вызывает подкрепление по рации в первом раунде, ведет огонь из укрытий одиночными выстрелами.'
  },
  {
    id: 'cpr-mook-pyro',
    nameRu: 'Пироман / Бустер Мальстрём (Pyro Booster)',
    nameEn: 'Pyro Booster',
    threatLevel: 'Mook',
    faction: 'Maelstrom / Street Gang',
    description: 'Одержимый огнём бустер с имплантированными огнемётами или зажигательными смесями.',
    stats: { INT: 3, REF: 6, DEX: 6, TECH: 5, COOL: 4, WILL: 4, LUCK: 0, MOVE: 5, BODY: 5, EMP: 2 },
    hpMax: 35,
    headSp: 7,
    bodySp: 11,
    armorName: 'Кожаная куртка с кевларовыми вставками',
    weapons: [
      {
        id: 'w-pyro-shotgun',
        name: 'Дробовик с зажигательными зарядами',
        category: 'Shotgun',
        damage: '5d6',
        standardRof: 1,
        magCapacity: 8,
        currentAmmo: 8,
        ammoType: 'Зажигательные жаканы'
      },
      {
        id: 'w-pyro-vhp',
        name: 'Очень тяжёлый пистолет',
        category: 'Very Heavy Pistol',
        damage: '4d6',
        standardRof: 1,
        magCapacity: 8,
        currentAmmo: 8,
        ammoType: 'Тяжелые пистолетные'
      },
      {
        id: 'w-pyro-claws',
        name: 'Киберкогти / Царапки (Scratchers)',
        category: 'Light Melee',
        damage: '1d6',
        standardRof: 2,
        magCapacity: 1,
        currentAmmo: 1,
        ammoType: 'Melee'
      }
    ],
    skills: [
      { nameRu: 'Длинноствольное оружие', base: 11 },
      { nameRu: 'Тяжёлое оружие', base: 10 },
      { nameRu: 'Драка', base: 10 },
      { nameRu: 'Уклонение', base: 8 },
      { nameRu: 'Сопротивление пыткам/наркотикам', base: 9 }
    ],
    cyberware: ['Киберглаза с инфракрасным визором', 'Киберкогти'],
    gear: ['Зажигательные гранаты x2', 'Доза стимулятора Black Lace'],
    tactics: 'Атакует огнем на близкой дистанции, пытаясь поджечь цели. Не боится боли благодаря стимуляторам.'
  },
  {
    id: 'cpr-lieutenant-solo',
    nameRu: 'Ветеран-Соло (Solo Veteran)',
    nameEn: 'Solo Veteran',
    threatLevel: 'Lieutenant',
    faction: 'Независимый наёмник / Синдикат',
    description: 'Опытный ветеран десятка корпоративных войн. Реакция усилена Керензиковым.',
    stats: { INT: 6, REF: 8, DEX: 8, TECH: 4, COOL: 7, WILL: 6, LUCK: 4, MOVE: 6, BODY: 8, EMP: 3 },
    hpMax: 50,
    headSp: 13,
    bodySp: 13,
    armorName: 'Тяжёлый арморджек (Heavy Armorjack, штраф -2)',
    weapons: [
      {
        id: 'w-solo-ar',
        name: 'Штурмовая винтовка Militech Ronin (Отличное)',
        category: 'Assault Rifle',
        damage: '5d6',
        standardRof: 1,
        magCapacity: 30,
        currentAmmo: 30,
        ammoType: 'Винтовочные AP',
        quality: 'Excellent'
      },
      {
        id: 'w-solo-katana',
        name: 'Моно-катана Kendachi (Heavy Melee)',
        category: 'Heavy Melee',
        damage: '3d6',
        standardRof: 2,
        magCapacity: 1,
        currentAmmo: 1,
        ammoType: 'Melee'
      }
    ],
    skills: [
      { nameRu: 'Боевая готовность (Solo)', base: 4 },
      { nameRu: 'Длинноствольное оружие', base: 14 },
      { nameRu: 'Короткоствольное оружие', base: 14 },
      { nameRu: 'Уклонение', base: 13 },
      { nameRu: 'Холодное оружие', base: 13 },
      { nameRu: 'Тактика', base: 10 }
    ],
    cyberware: ['Керензиков (+2 к инициативе)', 'Нейролинк', 'Смарт-линк', 'Усиленный скелет'],
    gear: ['Бронебойные патроны x60', 'ЭМИ граната', 'Траума-карта Silver'],
    tactics: 'Использует укрытия, активирует Способность Соло на урон или реакцию, методично фокусит самую опасную цель.'
  },
  {
    id: 'cpr-boss-cyberpsycho',
    nameRu: 'Киберпсихопат (Cyberpsycho)',
    nameEn: 'Cyberpsycho',
    threatLevel: 'Boss',
    faction: 'Одиночка / Потерявший человечность',
    description: 'Гора хрома, адамантия и гидравлики. Человечность потеряна, осталась лишь жажда бойни.',
    stats: { INT: 3, REF: 8, DEX: 8, TECH: 4, COOL: 4, WILL: 8, LUCK: 0, MOVE: 8, BODY: 11, EMP: 0 },
    hpMax: 65,
    headSp: 14,
    bodySp: 15,
    armorName: 'Подкожная броня + Металгир (SP 14/15)',
    weapons: [
      {
        id: 'w-cp-shotgun',
        name: 'Тяжёлый пулемёт Цунами (Very Heavy MG)',
        category: 'Assault Rifle',
        damage: '5d6',
        standardRof: 1,
        magCapacity: 50,
        currentAmmo: 50,
        ammoType: 'Крупнокалиберные'
      },
      {
        id: 'w-cp-gorilla',
        name: 'Гидравлические киберкулаки (Very Heavy Melee)',
        category: 'Very Heavy Melee',
        damage: '4d6',
        standardRof: 2,
        magCapacity: 1,
        currentAmmo: 1,
        ammoType: 'Melee'
      }
    ],
    skills: [
      { nameRu: 'Драка / Рукопашный бой', base: 15 },
      { nameRu: 'Тяжёлое оружие', base: 14 },
      { nameRu: 'Уклонение от пуль', base: 14 },
      { nameRu: 'Атлетика', base: 12 },
      { nameRu: 'Сопротивление пыткам', base: 14 }
    ],
    cyberware: ['Киберруки Gorilla', 'Подкожная броня', 'Сандевистан (+3 к инициативе)', 'Киберноги с прыжковыми сервоприводами'],
    gear: ['Запасной пулемётный короб x2', 'Стимулятор Berserk'],
    tactics: 'Сокращает дистанцию гигантскими прыжками, крушит препятствия, игнорирует половину урона холодным оружием.'
  },
  {
    id: 'cpr-drone-spider',
    nameRu: 'Боевой шагоход-паук (Combat Spider Drone)',
    nameEn: 'Combat Spider Drone',
    threatLevel: 'Drone',
    faction: 'Автоматическая охрана',
    description: 'Четырёхногий автономный дрон Militech с автоматическим пулемётом и сенсорами движения.',
    stats: { INT: 1, REF: 7, DEX: 6, TECH: 1, COOL: 1, WILL: 1, LUCK: 0, MOVE: 6, BODY: 8, EMP: 0 },
    hpMax: 30,
    headSp: 11,
    bodySp: 11,
    armorName: 'Композитная обшивка дрона (SP 11)',
    weapons: [
      {
        id: 'w-dr-smg',
        name: 'Встроенный спаренный ПП',
        category: 'SMG',
        damage: '3d6',
        standardRof: 1,
        magCapacity: 60,
        currentAmmo: 60,
        ammoType: 'Пистолетные'
      }
    ],
    skills: [
      { nameRu: 'Стрельба из ПП', base: 11 },
      { nameRu: 'Восприятие сенсоров', base: 12 },
      { nameRu: 'Уклонение', base: 8 }
    ],
    cyberware: [],
    gear: [],
    tactics: 'Патрулирует периметр. Уязвим к ЭМИ-гранатам и взлому через Сеть.'
  }
];
