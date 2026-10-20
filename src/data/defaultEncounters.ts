import { Encounter } from '../types/bestiary';

export const DEFAULT_ENCOUNTERS: Encounter[] = [
  {
    id: 'enc-bozos-carnival',
    title: 'Засада банды Bozos в заброшенном луна-парке',
    description: 'Клоуны-маньяки устроили ловушку среди ржавых каруселей Нортсайда. Площадь заминирована хлопушками с газом, из громкоговорителей доносится искаженный хохот.',
    location: 'Заброшенный карнавал «HappyLand», Нортсайд',
    threatLevel: 'Medium',
    tags: ['Bozos', 'Засада', 'Нортсайд', 'Банда'],
    createdAt: 1729450000000,
    updatedAt: 1729450000000,
    npcs: [
      {
        id: 'enc-npc-bozo-1',
        templateId: 'dg-bozo-prankster',
        name: 'Бозо: Шут-подрывник',
        count: 2,
        threatLevel: 'Mook',
        type: 'enemy',
        hpMax: 35,
        headSp: 7,
        bodySp: 7,
        ref: 7,
        dex: 7,
        move: 6,
        body: 6,
        weapons: [
          {
            id: 'w-bozo-shotgun',
            name: 'Помповый дробовик с конфетти и картечью',
            category: 'Shotgun',
            damage: '5d6',
            standardRof: 1,
            magCapacity: 6,
            currentAmmo: 6,
            ammoType: 'Картечь'
          }
        ],
        notes: 'Использует веселящий газ и прячется за каруселями.'
      },
      {
        id: 'enc-npc-bozo-pyro',
        templateId: 'cpr-mook-pyro',
        name: 'Бустер-пироман (Мальстрём)',
        count: 1,
        threatLevel: 'Mook',
        type: 'enemy',
        hpMax: 35,
        headSp: 7,
        bodySp: 7,
        ref: 6,
        dex: 6,
        move: 5,
        body: 7,
        weapons: [
          {
            id: 'w-pyro-flamer',
            name: 'Кустарный огнемёт',
            category: 'Flamethrower',
            damage: '4d6',
            standardRof: 1,
            magCapacity: 4,
            currentAmmo: 4,
            ammoType: 'Напалм'
          }
        ],
        notes: 'Поджигает укрытия игроков.'
      }
    ]
  },
  {
    id: 'enc-puma-patrol',
    title: 'Патруль частного детективного агентства Danger Gal',
    description: 'Оперативницы отряда Puma оцепили периметр аптеки Watson Vet. Вооружены смарт-оружием, кошачьими киберглазами и боевым дроном-пауком.',
    location: 'Аптека Watson Vet, Маленький Китай',
    threatLevel: 'High',
    tags: ['DangerGal', 'PumaSquad', 'Корпо', 'Патруль'],
    createdAt: 1729451000000,
    updatedAt: 1729451000000,
    npcs: [
      {
        id: 'enc-npc-puma-1',
        templateId: 'dg-puma-operative',
        name: 'Danger Gal: Оперативница отряда Puma',
        count: 2,
        threatLevel: 'Lieutenant',
        type: 'enemy',
        hpMax: 45,
        headSp: 11,
        bodySp: 11,
        ref: 8,
        dex: 8,
        move: 7,
        body: 6,
        weapons: [
          {
            id: 'w-puma-smg',
            name: 'Смарт-ПП Militech (Отличное кач-во)',
            category: 'SMG',
            damage: '3d6',
            standardRof: 1,
            magCapacity: 30,
            currentAmmo: 30,
            ammoType: 'Смарт-патроны'
          }
        ],
        notes: 'Координируют действия через коммлинк, бросают электрошоковые гранаты.'
      },
      {
        id: 'enc-npc-spider-drone',
        templateId: 'cpr-drone-spider',
        name: 'Боевой шагоход-паук (Combat Spider Drone)',
        count: 1,
        threatLevel: 'Drone',
        type: 'drone',
        hpMax: 25,
        headSp: 7,
        bodySp: 7,
        ref: 7,
        dex: 6,
        move: 6,
        body: 4,
        weapons: [
          {
            id: 'w-drone-smg',
            name: 'Спаренный курсовой ПП',
            category: 'SMG',
            damage: '3d6',
            standardRof: 1,
            magCapacity: 30,
            currentAmmo: 30,
            ammoType: 'Стандартные'
          }
        ],
        notes: 'Прикрывает оперативниц, уязвим к ЭМИ.'
      }
    ]
  },
  {
    id: 'enc-ncpd-checkpoint',
    title: 'Блокпост NCPD и кордон быстрого реагирования',
    description: 'Участок №1 перекрыл верхнюю эстакаду. Офицеры проверяют ID-чипы, сканируют на кибероружие и готовы стрелять при любой подозрительной активности.',
    location: 'Чекпоинт Верхней Эстакады, Кабуки',
    threatLevel: 'Medium',
    tags: ['NCPD', 'Закон', 'Блокпост', 'Улица'],
    createdAt: 1729452000000,
    updatedAt: 1729452000000,
    npcs: [
      {
        id: 'enc-npc-ncpd-1',
        templateId: 'dg-ncpd-patrol',
        name: 'NCPD: Офицер участка №1',
        count: 3,
        threatLevel: 'Mook',
        type: 'enemy',
        hpMax: 40,
        headSp: 11,
        bodySp: 11,
        ref: 6,
        dex: 6,
        move: 5,
        body: 7,
        weapons: [
          {
            id: 'w-ncpd-shotgun',
            name: 'Полицейский тактический дробовик',
            category: 'Shotgun',
            damage: '5d6',
            standardRof: 1,
            magCapacity: 8,
            currentAmmo: 8,
            ammoType: 'Жаканы'
          },
          {
            id: 'w-ncpd-pistol',
            name: 'Служебный тяжёлый пистолет Sternmeyer',
            category: 'Heavy Pistol',
            damage: '3d6',
            standardRof: 2,
            magCapacity: 12,
            currentAmmo: 12,
            ammoType: 'Пистолетные'
          }
        ],
        notes: 'Требуют сдаться, при сопротивлении вызывают спецназ MAX-TAC.'
      },
      {
        id: 'enc-npc-guard-officer',
        templateId: 'cpr-mook-security-guard',
        name: 'Офицер службы безопасности (Security Officer)',
        count: 1,
        threatLevel: 'Mook',
        type: 'enemy',
        hpMax: 35,
        headSp: 7,
        bodySp: 7,
        ref: 6,
        dex: 5,
        move: 4,
        body: 6,
        weapons: [
          {
            id: 'w-sec-ar',
            name: 'Штурмовая винтовка Militech Ronin',
            category: 'Assault Rifle',
            damage: '5d6',
            standardRof: 1,
            magCapacity: 30,
            currentAmmo: 30,
            ammoType: 'Винтовочные'
          }
        ],
        notes: 'Командует блокпостом, держит дистанцию.'
      }
    ]
  },
  {
    id: 'enc-piranhas-party',
    title: 'Нападение банды Пираний в клубе Totentanz',
    description: 'Толпа накачанных стимуляторами рейверов в неоновых куртках набрасывается на чужаков прямо на танцполе под оглушающие басы индастриала.',
    location: 'Клуб Totentanz, Нижний уровень',
    threatLevel: 'Low',
    tags: ['Piranhas', 'Клуб', 'Вечеринка', 'Банда'],
    createdAt: 1729453000000,
    updatedAt: 1729453000000,
    npcs: [
      {
        id: 'enc-npc-pir-1',
        templateId: 'dg-piranha-ganger',
        name: 'Пиранья: Уличный рейвер',
        count: 4,
        threatLevel: 'Mook',
        type: 'enemy',
        hpMax: 30,
        headSp: 4,
        bodySp: 4,
        ref: 6,
        dex: 7,
        move: 6,
        body: 5,
        weapons: [
          {
            id: 'w-pir-smg',
            name: 'Скорострельный компактный ПП',
            category: 'SMG',
            damage: '3d6',
            standardRof: 1,
            magCapacity: 30,
            currentAmmo: 30,
            ammoType: 'Пистолетные'
          },
          {
            id: 'w-pir-knife',
            name: 'Зазубренный нож (Light Melee)',
            category: 'Light Melee',
            damage: '1d6',
            standardRof: 2,
            magCapacity: 1,
            currentAmmo: 1,
            ammoType: 'Melee'
          }
        ],
        notes: 'Ослепляют стробоскопами и нападают стаей.'
      }
    ]
  },
  {
    id: 'enc-bozo-boss-circus',
    title: 'Финальное шоу «Большого Носа» (Босс-энкаунтер)',
    description: 'Сам Кольцевой Мастер клоунов со своей свитой загнал партию в тупик за кулисами цирка. В воздухе ядовитый нервно-паралитический газ, повсюду заминированные хлопушки.',
    location: 'Главный цирковой купол «Большого Носа»',
    threatLevel: 'Deadly',
    tags: ['Босс', 'Bozos', 'Смертельный', 'Газ'],
    createdAt: 1729454000000,
    updatedAt: 1729454000000,
    npcs: [
      {
        id: 'enc-npc-bozo-boss',
        templateId: 'dg-bozo-boss',
        name: 'Бозо: Кольцевой Мастер «Большой Нос»',
        count: 1,
        threatLevel: 'Boss',
        type: 'enemy',
        hpMax: 65,
        headSp: 13,
        bodySp: 13,
        ref: 8,
        dex: 8,
        move: 7,
        body: 9,
        weapons: [
          {
            id: 'w-bozo-gl',
            name: 'Гранатомёт-сюрприз (Газовые гранаты)',
            category: 'Grenade Launcher',
            damage: '6d6',
            standardRof: 1,
            magCapacity: 4,
            currentAmmo: 4,
            ammoType: 'Газовые гранаты'
          },
          {
            id: 'w-bozo-cane',
            name: 'Трость с моно-лезвием (Heavy Melee)',
            category: 'Heavy Melee',
            damage: '3d6',
            standardRof: 2,
            magCapacity: 1,
            currentAmmo: 1,
            ammoType: 'Melee'
          }
        ],
        notes: 'Керензиков (+2 инициатива). Забрасывает газом и добивает монотростью.'
      },
      {
        id: 'enc-npc-bozo-minions',
        templateId: 'dg-bozo-prankster',
        name: 'Бозо: Шут-подрывник',
        count: 2,
        threatLevel: 'Mook',
        type: 'enemy',
        hpMax: 35,
        headSp: 7,
        bodySp: 7,
        ref: 7,
        dex: 7,
        move: 6,
        body: 6,
        weapons: [
          {
            id: 'w-bozo-shotgun',
            name: 'Помповый дробовик с конфетти и картечью',
            category: 'Shotgun',
            damage: '5d6',
            standardRof: 1,
            magCapacity: 6,
            currentAmmo: 6,
            ammoType: 'Картечь'
          }
        ],
        notes: 'Отвлекают игроков и защищают босса.'
      }
    ]
  }
];
