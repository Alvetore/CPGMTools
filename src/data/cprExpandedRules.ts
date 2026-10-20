// Cyberpunk RED Expanded Rules & GM Data
// Sources: Corebook, Interface RED, Listen Up!, Solo of Fortune, Night Markets, Data Pool

export interface SituationalModifier {
  id: string;
  nameRu: string;
  category: 'environment' | 'condition' | 'tools' | 'advantage';
  modifier: number;
  description: string;
}

export const SITUATIONAL_MODIFIERS: SituationalModifier[] = [
  { id: 'mod-night', nameRu: 'Ночь или слабое освещение', category: 'environment', modifier: -1, description: 'Полумрак, тени, мерцающий неон' },
  { id: 'mod-first-time', nameRu: 'Никогда раньше этого не делал', category: 'condition', modifier: -1, description: 'Отсутствие базового опыта в данной конкретной задаче' },
  { id: 'mod-complex', nameRu: 'Особенно сложная задача', category: 'environment', modifier: -2, description: 'Нестандартная конструкция или замысловатый механизм' },
  { id: 'mod-no-tools', nameRu: 'Нет подходящих инструментов', category: 'tools', modifier: -2, description: 'Приходится импровизировать подручными средствами' },
  { id: 'mod-poor-sleep', nameRu: 'Неудобно спал накануне / легкий стресс', category: 'condition', modifier: -2, description: 'Болит шея, спал в куб-отеле на продавленном матрасе' },
  { id: 'mod-stress', nameRu: 'Стрессовые условия / под давлением', category: 'condition', modifier: -2, description: 'Таймер бомбы, крики заложников, сирены' },
  { id: 'mod-exhausted', nameRu: 'Истощение / без сна более 24 часов', category: 'condition', modifier: -4, description: 'Глаза слипаются, реакция заторможена' },
  { id: 'mod-drunk', nameRu: 'Алкогольное или наркотическое опьянение', category: 'condition', modifier: -4, description: 'Действие кармотрина, синт-кокаина или тяжелых веществ' },
  { id: 'mod-extreme-stealth', nameRu: 'Приходится действовать предельно скрытно', category: 'condition', modifier: -4, description: 'Шаг в сторону выдаст всю группу' },
  { id: 'mod-smoke-dark', nameRu: 'Густой дым или абсолютная тьма', category: 'environment', modifier: -4, description: 'Пожар, слезоточивый газ, отключенное питание' },
  { id: 'mod-advantage-pos', nameRu: 'Выгодная позиция / возвышенность', category: 'advantage', modifier: 2, description: 'Тактическое превосходство на местности' },
  { id: 'mod-careful-prep', nameRu: 'Тщательная подготовка / чертежи', category: 'advantage', modifier: 2, description: 'Изучены схемы объекта и расписание охраны' }
];

// Skill Improvement Costs (IP / Очки Улучшений)
export const SKILL_IMPROVEMENT_TABLE = {
  regular: [
    { targetLevel: 1, cost: 20, totalFromZero: 20 },
    { targetLevel: 2, cost: 40, totalFromZero: 60 },
    { targetLevel: 3, cost: 60, totalFromZero: 120 },
    { targetLevel: 4, cost: 80, totalFromZero: 200 },
    { targetLevel: 5, cost: 100, totalFromZero: 300 },
    { targetLevel: 6, cost: 120, totalFromZero: 420 },
    { targetLevel: 7, cost: 140, totalFromZero: 560 },
    { targetLevel: 8, cost: 160, totalFromZero: 720 },
    { targetLevel: 9, cost: 180, totalFromZero: 900 },
    { targetLevel: 10, cost: 200, totalFromZero: 1100 }
  ],
  difficultX2: [
    { targetLevel: 1, cost: 40, totalFromZero: 40 },
    { targetLevel: 2, cost: 80, totalFromZero: 120 },
    { targetLevel: 3, cost: 120, totalFromZero: 240 },
    { targetLevel: 4, cost: 160, totalFromZero: 400 },
    { targetLevel: 5, cost: 200, totalFromZero: 600 },
    { targetLevel: 6, cost: 240, totalFromZero: 840 },
    { targetLevel: 7, cost: 280, totalFromZero: 1120 },
    { targetLevel: 8, cost: 320, totalFromZero: 1440 },
    { targetLevel: 9, cost: 360, totalFromZero: 1800 },
    { targetLevel: 10, cost: 400, totalFromZero: 2200 }
  ],
  roleAbility: [
    { targetLevel: 1, cost: 60, totalFromZero: 60 },
    { targetLevel: 2, cost: 120, totalFromZero: 180 },
    { targetLevel: 3, cost: 180, totalFromZero: 360 },
    { targetLevel: 4, cost: 240, totalFromZero: 600 },
    { targetLevel: 5, cost: 300, totalFromZero: 900 },
    { targetLevel: 6, cost: 360, totalFromZero: 1260 },
    { targetLevel: 7, cost: 420, totalFromZero: 1680 },
    { targetLevel: 8, cost: 480, totalFromZero: 2160 },
    { targetLevel: 9, cost: 540, totalFromZero: 2700 },
    { targetLevel: 10, cost: 600, totalFromZero: 3300 }
  ],
  rewardsGuide: [
    { ip: 10, criteria: 'Миссия провалена, но группа старалась и выжила' },
    { ip: 20, criteria: 'Едва достигли целей миссии с большими потерями' },
    { ip: 30, criteria: 'Успешное завершение стандартного контракта' },
    { ip: 40, criteria: 'Блестящее выполнение миссии с перевыполнением задач' },
    { ip: 50, criteria: 'Легендарный подвиг, изменивший расстановку сил в районе' }
  ]
};

// Vehicle Stunts & DVs
export const VEHICLE_MANOEUVRES = [
  { nameRu: 'Экстренное торможение / объезд препятствия', dv: 9, description: 'Базовый контроль машины на асфальте' },
  { nameRu: 'Резкий поворот в заносе / дрифт', dv: 13, description: 'Контролируемый занос на 90 градусов' },
  { nameRu: 'Разворот контрабандиста («Полицейский разворот» 180°)', dv: 17, description: 'Разворот на месте задним ходом с разгоном вперед' },
  { nameRu: 'Езда на двух боковых колёсах / узкий проезд', dv: 21, description: 'Машина удерживает баланс на боку' },
  { nameRu: 'Прыжок с трамплина / перелёт через разрыв моста', dv: 25, description: 'Кинематографичный трюк с риском разбиться' }
];

// Cover Materials & HP
export const COVER_MATERIALS = [
  { materialRu: 'Фанерная перегородка / гипсокартон', hp: 5, example: 'Офисные кубиклы, фанера' },
  { materialRu: 'Деревянная дверь / диван', hp: 10, example: 'Межкомнатная дверь, массивная мебель' },
  { materialRu: 'Капот легкового автомобиля', hp: 15, example: 'Двигательный отсек машины' },
  { materialRu: 'Кирпичная стена / стальной контейнер', hp: 25, example: 'Грузовой морской контейнер, кладка' },
  { materialRu: 'Железобетонная опора / балка', hp: 50, example: 'Несущая колонна паркинга, бункер' },
  { materialRu: 'Бронированная дверь банковского хранилища', hp: 100, example: 'Корпоративный сейф Arasaka, шлюз' }
];

// Economy & Services in Night City
export interface EconomyServiceItem {
  id: string;
  category: 'medical' | 'therapy' | 'body' | 'bars' | 'housing' | 'lifestyle' | 'trauma';
  nameRu: string;
  costEb: number;
  priceCategory: string;
  notes: string;
}

export const NIGHT_CITY_ECONOMY_SERVICES: EconomyServiceItem[] = [
  // Body sculpting
  { id: 'srv-bs-std', category: 'body', nameRu: 'Бодискульптинг (Стандартный)', costEb: 500, priceCategory: 'Дорогое (Expensive)', notes: 'Изменение черт лица, цвета кожи, коррекция веса' },
  { id: 'srv-bs-exo', category: 'body', nameRu: 'Бодискульптинг (Экзотический)', costEb: 1000, priceCategory: 'Очень дорогое (Very Expensive)', notes: 'Уши эльфа, шерсть, кошачьи глаза, клыки, чешуя' },
  { id: 'srv-bs-ext', category: 'body', nameRu: 'БИОскульптинг (Экстремальный)', costEb: 5000, priceCategory: 'Роскошь (Luxury)', notes: 'Полная трансформация тела в фурри, демона или рептилоида' },

  // Medical
  { id: 'srv-med-mall', category: 'medical', nameRu: 'Установка найденных имплантов (Молл / Риппердок)', costEb: 100, priceCategory: 'Премиум', notes: 'Базовая установка в грязных подвальных условиях' },
  { id: 'srv-med-clin', category: 'medical', nameRu: 'Установка найденных имплантов (Клиника МедТеха)', costEb: 500, priceCategory: 'Дорогое', notes: 'Стерильная операционная, качественная анестезия' },
  { id: 'srv-med-hosp', category: 'medical', nameRu: 'Установка имплантов (Корпоративный Госпиталь)', costEb: 1000, priceCategory: 'Очень дорогое', notes: 'Высший уровень надежности без риска заражения' },
  { id: 'srv-med-crit10', category: 'medical', nameRu: 'Лечение критической травмы (СЛ 10-13)', costEb: 100, priceCategory: 'Премиум', notes: 'Вывих, трещина, легкое пулевое ранение' },
  { id: 'srv-med-crit15', category: 'medical', nameRu: 'Лечение критической травмы (СЛ 15)', costEb: 500, priceCategory: 'Дорогое', notes: 'Сложные переломы, разрывы мышц, внутреннее кровотечение' },
  { id: 'srv-med-crit17', category: 'medical', nameRu: 'Лечение тяжелой травмы / Хирургия (СЛ 17+)', costEb: 1000, priceCategory: 'Очень дорогое', notes: 'Травма мозга, оторванная конечность, пробитое легкое' },

  // Therapy
  { id: 'srv-ther-std', category: 'therapy', nameRu: 'Стандартная терапия человечности (ПЧ)', costEb: 500, priceCategory: 'Дорогое', notes: 'Восстанавливает 2d6 Человечности за неделю отдыха' },
  { id: 'srv-ther-ext', category: 'therapy', nameRu: 'Экстремальная терапия человечности', costEb: 1000, priceCategory: 'Очень дорогое', notes: 'Восстанавливает 4d6 Человечности под наркозом в стационаре' },
  { id: 'srv-ther-add', category: 'therapy', nameRu: 'Терапия химической зависимости (Наркотики)', costEb: 1000, priceCategory: 'Очень дорогое', notes: 'Снимает синдром отмены и тягу к препарату' },

  // Trauma Team
  { id: 'srv-tt-silv', category: 'trauma', nameRu: 'Страховка Trauma Team Silver (Месяц)', costEb: 500, priceCategory: 'Дорогое', notes: 'Время прибытия АВ-4 до 7 минут, покрытие базовой эвакуации' },
  { id: 'srv-tt-corp', category: 'trauma', nameRu: 'Страховка Trauma Team Executive (Месяц)', costEb: 1000, priceCategory: 'Очень дорогое', notes: 'Прибытие до 3 минут, огневая поддержка боевого отряда' },

  // Bars & Dining
  { id: 'srv-bar-dive', category: 'bars', nameRu: 'Выпивка в придорожном дайв-баре', costEb: 10, priceCategory: 'Дешевка', notes: 'Синтетическое пиво, разбавленный виски' },
  { id: 'srv-bar-good', category: 'bars', nameRu: 'Коктейль в хорошем клубе (Totentanz / El Coyote)', costEb: 20, priceCategory: 'Обычное', notes: 'Качественные клубные напитки и стимуляторы' },
  { id: 'srv-bar-corp', category: 'bars', nameRu: 'Премиум алкоголь в корпоративном лаундже', costEb: 50, priceCategory: 'Ценное', notes: 'Настоящее выдержанное спиртное до войны' },
  { id: 'srv-bar-afterlife', category: 'bars', nameRu: 'Именной коктейль в «Посмертии» (Afterlife)', costEb: 100, priceCategory: 'Премиум', notes: '«Джонни Сильверхенд», «Джеки Уэллс» или коктейль легенды' },

  // Housing & Hotels
  { id: 'srv-house-cube', category: 'housing', nameRu: 'Аренда куб-отеля (Сутки / Месяц)', costEb: 20, priceCategory: 'Обычное', notes: '20 eb за сутки / 500 eb за месяц. Спальный пластиковый отсек' },
  { id: 'srv-house-cargo', category: 'housing', nameRu: 'Аренда грузового контейнера (Месяц)', costEb: 1000, priceCategory: 'Очень дорогое', notes: 'Жилой контейнер в доках с койкой и терминалом' },
  { id: 'srv-house-apt', category: 'housing', nameRu: 'Аренда студии в Хейвуде / Уотсоне (Месяц)', costEb: 1500, priceCategory: 'Очень дорогое', notes: 'Собственная комната, душ, охраняемый подъезд' },
  { id: 'srv-hotel-lux', category: 'housing', nameRu: 'Люкс в роскошном корпоративном отеле (Сутки)', costEb: 500, priceCategory: 'Дорогое', notes: 'Отель в Корпо-Плаза с панорамным видом и охраной' }
];

// Mercenary Gig Tiers
export const MERC_TIER_REWARDS = [
  {
    tierRu: 'Уличная шпана (Street Scum)',
    repLevel: 'Репутация 1-2',
    typicalRewardEb: '500 – 1,000 eb на группу',
    description: 'Мелкие разборки, выбивание долгов у лавочников, курьерская доставка по криминальным переулкам.'
  },
  {
    tierRu: 'Наёмники (Mercenaries)',
    repLevel: 'Репутация 3-5',
    typicalRewardEb: '1,500 – 3,000 eb на человека',
    description: 'Нападение на конвой банды, зачистка цеха, похищение инженера средней руки, защита закрытого клуба.'
  },
  {
    tierRu: 'Элитные оперативники (Prime Ops)',
    repLevel: 'Репутация 6-8',
    typicalRewardEb: '4,000 – 8,000 eb на человека',
    description: 'Проникновение на секретный объект Arasaka/Militech, кража прототипа кибероружия, ликвидация вице-президента.'
  },
  {
    tierRu: 'Легенды Найт-Сити (Night City Legends)',
    repLevel: 'Репутация 9-10',
    typicalRewardEb: '10,000 – 50,000+ eb на человека',
    description: 'Штурм Башни Арасаки, глобальные операции в Сети, спасение или уничтожение совета директоров.'
  }
];

// Drones Catalog
export interface DroneData {
  id: string;
  nameRu: string;
  typeRu: string;
  hp: number;
  sp: number;
  move: number;
  weapons: string[];
  hackDv: number;
  trigger: string;
  description: string;
}

export const DRONES_CATALOG: DroneData[] = [
  {
    id: 'drone-swarm',
    nameRu: 'Рой микро-беспилотников',
    typeRu: 'Микро-дрон стая',
    hp: 15,
    sp: 0,
    move: 8,
    weapons: ['Нанопроволочные лезвия (Оч.Тяж.Холодное, 4d6 урона, AP)'],
    hackDv: 17,
    trigger: 'Пересечение инфракрасного луча без метки сотрудника',
    description: 'Сотни жужжащих микро-дронов размером с шершня. Атакуют единой стаей, разрезая одежду и плоть.'
  },
  {
    id: 'drone-ground-ball',
    nameRu: 'Боевой наземный дрон-сфера',
    typeRu: 'Наземный колесный/сферический',
    hp: 30,
    sp: 7,
    move: 6,
    weapons: ['Тяжёлый пистолет Sternmeyer (3d6)', 'Камера кругового обзора'],
    hackDv: 17,
    trigger: 'Датчик движения в коридоре охраняемой зоны',
    description: 'Быстрый бронированный шар, раскладывающийся в боевую платформу при обнаружении нарушителя.'
  },
  {
    id: 'drone-spider',
    nameRu: 'Боевой дрон-паук Militech',
    typeRu: 'Тяжелый шагоход',
    hp: 40,
    sp: 11,
    move: 5,
    weapons: ['Гранатомёт с 2 слезоточивыми гранатами', 'Спаренный тактический ПП (3d6)'],
    hackDv: 21,
    trigger: 'Тревога охранного контура здания',
    description: 'Четвероногий тяжелый дрон для зачистки коридоров и подавления бунтов.'
  },
  {
    id: 'drone-eagle',
    nameRu: 'Дрон «Саванный Орёл» (Оптический камуфляж)',
    typeRu: 'Летающий БПЛА-охотник',
    hp: 25,
    sp: 7,
    move: 8,
    weapons: ['ПП с резиновыми или боевыми пулями (3d6)', 'Акустический визгун'],
    hackDv: 21,
    trigger: 'Визуальное распознавание лиц в розыске',
    description: 'Маскируется под хищную птицу. Имеет встроенный термооптический камуфляж (СЛ 17 Восприятия для обнаружения неподвижного дрона).'
  },
  {
    id: 'drone-graf3',
    nameRu: 'Тяжелый робот-жираф GRAF3',
    typeRu: 'Инженерно-сторожевой шагоход',
    hp: 60,
    sp: 11,
    move: 3,
    weapons: ['Гидравлический манипулятор-таран (4d6 урона)'],
    hackDv: 17,
    trigger: 'Проникновение на строительную площадку',
    description: 'Огромный промышленный дрон высотой 4 метра. Используется корпорациями для охраны складов и строек.'
  }
];

// Traps Catalog
export interface TrapData {
  id: string;
  nameRu: string;
  detectDv: number;
  disarmDv: number;
  effect: string;
  description: string;
}

export const TRAPS_CATALOG: TrapData[] = [
  {
    id: 'trap-trip-frag',
    nameRu: 'Растяжка с осколочной гранатой',
    detectDv: 13,
    disarmDv: 13,
    effect: 'Взрыв 6d6 урона по всем целям в радиусе 6x6м (уклонение от взрыва DV 15 при РЕФ 8+)',
    description: 'Тонкая монолеска на уровне щиколоток, привязанная к чеке осколочной гранаты F-1.'
  },
  {
    id: 'trap-trip-emp',
    nameRu: 'ЭМИ-растяжка (EMP Trap)',
    detectDv: 15,
    disarmDv: 15,
    effect: 'Все киберимпланты и электронное оружие в радиусе 4м отключаются на 1 минуту',
    description: 'Скрытый конденсатор с направленным импульсом для нейтрализации киборгов и соло.'
  },
  {
    id: 'trap-gas-choke',
    nameRu: 'Распылитель нервно-паралитического газа',
    detectDv: 17,
    disarmDv: 15,
    effect: 'Все без респиратора делают проверку Сопротивления ядам (DV 15) или получают статус «Удушье» и 2d6 урона напрямую в HP минуя броню',
    description: 'Скрытая потолочная форсунка, подключенная к баллону под давлением.'
  },
  {
    id: 'trap-laser-grid',
    nameRu: 'Лазерная охранная решётка с сигнализацией',
    detectDv: 13,
    disarmDv: 17,
    effect: 'Мгновенный подъем тревоги всего здания + автоматическая блокировка шлюзов',
    description: 'Сетка невидимых инфракрасных лучей (видна через ИК-очки или дым).'
  },
  {
    id: 'trap-claymore',
    nameRu: 'Нажимная направленная мина «Клеймор»',
    detectDv: 15,
    disarmDv: 17,
    effect: '8d6 урона в конусе 6 метров перед миной, стирает 2 пункта брони (ОС) при пробитии',
    description: 'Пластиковая коробка C-4 со стальными шариками, замаскированная под мусор.'
  }
];

// Flashback Luck (Вспышка Удачи) Tiers
export const FLASHBACK_LUCK_TIERS = [
  {
    luckCost: 1,
    titleRu: 'Базовый предмет или мелкая заготовка',
    examples: 'Взял с собой моток клейкой ленты, фомку, патроны нужного калибра, дешевый фонарик, чистые перчатки, предмет дешевле 100 eb.',
    limits: 'Предмет должен логично помещаться в карман или рюкзак.'
  },
  {
    luckCost: 2,
    titleRu: 'Локальная ситуативная подготовка',
    examples: 'Оставил приоткрытым окно пожарного выхода, заранее изучил план вентиляции, припрятал лёгкий пистолет в мусорном баке у входа.',
    limits: 'Требуется обосновать, когда персонаж успел это сделать до начала операции.'
  },
  {
    luckCost: '3 – 4',
    titleRu: 'Серьезная подготовка / Социальный контакт',
    examples: 'Подкупил охранника, чтобы тот отошел покурить на 10 минут; раздобыл рабочий гостевой пропуск; отключил камеру в одном коридоре.',
    limits: 'Игрок оплачивает стоимость взятки в eb и совершает проверку соответствующего навыка (Убеждение, Взлом).'
  },
  {
    luckCost: '5 – 8',
    titleRu: 'Экстраординарный реткон / Счастливый случай',
    examples: 'Один из персонажей лично знаком с начальником смены; знает скрытый дефект замка этой марки; накануне перехватил пароль от пульта тревоги.',
    limits: 'Мастер имеет право вето, если заявка ломает логику сюжета или полностью отменяет кульминацию.'
  }
];

// Street Incidents D100 Table
export interface StreetIncidentEvent {
  rollMin: number;
  rollMax: number;
  timeOfDay: 'day' | 'evening' | 'night' | 'any';
  titleRu: string;
  description: string;
  unitsSummary: string;
  tactics: string;
}

export const STREET_INCIDENTS_D100: StreetIncidentEvent[] = [
  {
    rollMin: 1,
    rollMax: 10,
    timeOfDay: 'day',
    titleRu: 'Патруль NCPD: Проверка документов и сканирование',
    description: 'Двое патрульных офицеров в кевларе останавливают прохожих для выборочной проверки ID-чипов и сканирования оружия.',
    unitsSummary: '2 патрульных NCPD (Тяжелые пистолеты, кевлар ОС 7)',
    tactics: 'Требуют предъявить чипы. Если видят персонажей в розыске — вызывают тактическую группу поддержки (1d6 раундов).'
  },
  {
    rollMin: 11,
    rollMax: 20,
    timeOfDay: 'any',
    titleRu: 'Корпоративная охрана на выезде',
    description: 'Охранники местной суб-корпорации оцепили проезд для эскорта вице-президента.',
    unitsSummary: '3 корпоративных охранника (ПП, арморджек ОС 11)',
    tactics: 'Грубо кричат: «Двигай отсюда, панк!». Не открывают огонь первыми, пока персонажи не достанут стволы.'
  },
  {
    rollMin: 21,
    rollMax: 30,
    timeOfDay: 'night',
    titleRu: 'Налёт бустеров банды Мальстрём',
    description: 'Трое тяжело модифицированных бустеров на ревущих мотоциклах блокируют переулок с криками и выстрелами в воздух.',
    unitsSummary: '3 бустера Мальстрём (Дробовики, холодное оружие, киберглаза)',
    tactics: 'Окружают жертв, требуют отдать всё ценное и хром. При сопротивлении сразу бросают зажигательную гранату.'
  },
  {
    rollMin: 31,
    rollMax: 40,
    timeOfDay: 'evening',
    titleRu: 'Слежка частного детектива',
    description: 'Потертый детектив в плаще и шляпе сидит за газетой в лапшичной и фотографирует кого-то из партии на скрытую камеру.',
    unitsSummary: '1 детектив (Оч.Тяж.Пистолет, шпионский софт)',
    tactics: 'При обнаружении пытается скрыться в толпе. При поимке раскалывается, кто из врагов партии нанял его.'
  },
  {
    rollMin: 41,
    rollMax: 50,
    timeOfDay: 'night',
    titleRu: 'Торговец контрабандой из багажника',
    description: 'Кочевник в пыльной куртке продает с фургона редкие патроны, паленый софт и свежее мясо.',
    unitsSummary: '1 торговец-кочевник + 1 охранник с винтовкой',
    tactics: 'Мирные, если не пытаться грабить. Могут продать редкие предметы со скидкой 10%.'
  },
  {
    rollMin: 51,
    rollMax: 65,
    timeOfDay: 'any',
    titleRu: 'Вызов Trauma Team: Зона поражения',
    description: 'На крышу соседнего здания с ревом садится АВ-4 Trauma Team. Бойцы в зеленой броне высаживаются с оружием наперевес.',
    unitsSummary: '4 оперативника Trauma Team (Штурмовые винтовки, Флак ОС 15)',
    tactics: 'Держат периметр в 10 метрах от платинового клиента. Стреляют на поражение при пересечении запретной черты.'
  },
  {
    rollMin: 66,
    rollMax: 80,
    timeOfDay: 'evening',
    titleRu: 'Пьяная драка у небюджетного бара',
    description: 'Толпа пьяных корпоратов спорит с рокербоями из-за разбитого зеркала дорогого спорткара Aerondight.',
    unitsSummary: '4 пьяных корпората (штраф -4) + 2 уличных панка',
    tactics: 'Хаотичная потасовка, можно ограбить, разнять или использовать для шума.'
  },
  {
    rollMin: 81,
    rollMax: 90,
    timeOfDay: 'night',
    titleRu: 'Сбойный охранный дрон-шагоход',
    description: 'Сбившийся с маршрута дрон-паук с искрами из корпуса палит короткими очередями по мусорным бакам.',
    unitsSummary: '1 поврежденный дрон (20 HP, ПП 3d6, взлом DV 13)',
    tactics: 'Атакует ближайший источник звука или движения. Можно взломать Нетраннером или разобрать на ценные детали (200 eb).'
  },
  {
    rollMin: 91,
    rollMax: 100,
    timeOfDay: 'any',
    titleRu: 'Киберпсих на свободе (Красная тревога!)',
    description: 'Одинокий накачанный имплантами убийца с клинками богомола выламывает дверь лапшичной. Вокруг сирены MAX-TAC!',
    unitsSummary: '1 Киберпсихопат (55 HP, ОС 13, богомолы 3d6, уклонение 14)',
    tactics: 'Безумная резня без переговоров. Через 3 раунда на место прибывает штурмовая группа MAX-TAC.'
  }
];

// Official Cyberpunk RED Vending Machine Table (1d6 Category + 1d10 Item)
export interface VendingTableRow {
  d10: number;
  food: string;     // 1d6: 1-3 (Еда)
  personal: string; // 1d6: 4-5 (Личные)
  cursed: string;   // 1d6: 6   (Что-то очень всратое)
}

export const VENDING_MACHINE_TABLE: VendingTableRow[] = [
  { d10: 1, food: 'Лапша Рамен', personal: 'Футболка в банке', cursed: 'Парик для Животных' },
  { d10: 2, food: 'Пицца', personal: 'Секс Игрушка', cursed: 'Еда для жуков' },
  { d10: 3, food: 'Гамбургер', personal: 'Зонтик', cursed: 'Шарик Салата' },
  { d10: 4, food: 'Смэш', personal: 'Галстук', cursed: 'Суп из летучей Рыбы' },
  { d10: 5, food: 'Суши', personal: 'Медицинские маски', cursed: 'Выращенные в чане морепродукты' },
  { d10: 6, food: 'Горячее Мясо', personal: 'Нижнее бельё', cursed: 'Запах в банке' },
  { d10: 7, food: '1кг Упаковка Киббла', personal: 'Цветочная композиция', cursed: 'Живые жуки-носороги' },
  { d10: 8, food: 'Консервированный кофе', personal: 'Пушки и боеприпасы', cursed: 'Бумажные Костюмы для Косплея' },
  { d10: 9, food: 'Консервированный сок', personal: 'Щепки для Брейнданса', cursed: 'Причудливые игрушки в капсулах' },
  { d10: 10, food: 'Консервированные безалкогольные напитки', personal: 'Видео Игры', cursed: 'Ношенные Трусы' }
];

export interface RolledVendingResult {
  d6: number;
  d10: number;
  category: 'food' | 'personal' | 'cursed';
  categoryLabel: string;
  name: string;
}
