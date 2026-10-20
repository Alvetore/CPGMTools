import { BlackIceProgram } from '../types/netrun';

export const OFFICIAL_BLACK_ICE: BlackIceProgram[] = [
  {
    id: 'bi-hellhound',
    nameRu: 'Адская гончая (Hellhound)',
    nameEn: 'Hellhound',
    category: 'Anti-Personnel',
    spd: 6,
    atk: 6,
    def: 2,
    rezMax: 20,
    effectRu: 'Наносит 2d6 урона мозгу нетраннера. Поджигает нервную систему (+1d6 урона в начале каждого хода нетраннера, пока не выйдет из сети).'
  },
  {
    id: 'bi-asp',
    nameRu: 'Аспид (Asp)',
    nameEn: 'Asp',
    category: 'Anti-Personnel',
    spd: 6,
    atk: 4,
    def: 2,
    rezMax: 15,
    effectRu: 'Наносит 3d6 урона мозгу нетраннера. Вводит цифровой нейротоксин (-2 ко всем проверкам нетраннера до выхода из сети).'
  },
  {
    id: 'bi-scorpion',
    nameRu: 'Скорпион (Scorpion)',
    nameEn: 'Scorpion',
    category: 'Anti-Personnel',
    spd: 6,
    atk: 2,
    def: 2,
    rezMax: 15,
    effectRu: 'Жалит кибердеку: нетраннер не может перемещаться по этажам и не может выполнить аварийный выход (Jack Out) без уничтожения Скорпиона.'
  },
  {
    id: 'bi-raven',
    nameRu: 'Ворон (Raven)',
    nameEn: 'Raven',
    category: 'Anti-Program',
    spd: 4,
    atk: 4,
    def: 4,
    rezMax: 15,
    effectRu: 'Атакует защитные программы нетраннера: мгновенно дереззит случайную программу-защитник (Defender) или отключает броню кибердеки.'
  },
  {
    id: 'bi-skunk',
    nameRu: 'Скунс (Skunk)',
    nameEn: 'Skunk',
    category: 'Anti-Program',
    spd: 2,
    atk: 4,
    def: 2,
    rezMax: 10,
    effectRu: 'Распыляет вирусный код: нетраннер получает штраф -2 ко всем сетевым действиям (Interface), пока не декомпилирует Скунса.'
  },
  {
    id: 'bi-kraken',
    nameRu: 'Кракен (Kraken)',
    nameEn: 'Kraken',
    category: 'Anti-Personnel',
    spd: 2,
    atk: 8,
    def: 4,
    rezMax: 30,
    effectRu: 'Тяжелый страж данных: наносит 3d6 урона мозгу и захватывает сознание в тиски (невозможно сдвинуться).'
  },
  {
    id: 'bi-giant',
    nameRu: 'Гигант (Giant)',
    nameEn: 'Giant',
    category: 'Anti-Program',
    spd: 2,
    atk: 8,
    def: 4,
    rezMax: 25,
    effectRu: 'Крушит установленные атакующие программы netrunner: 3d6 урона REZ выбранной программы.'
  },
  {
    id: 'bi-dragon',
    nameRu: 'Дракон (Dragon)',
    nameEn: 'Dragon',
    category: 'Anti-Personnel',
    spd: 6,
    atk: 6,
    def: 6,
    rezMax: 25,
    effectRu: 'Военный страж Arasaka: наносит 4d6 урона мозгу. При уничтожении взрывается, дереззя все программы на этаже.'
  }
];

export const DEMON_PROGRAMS = [
  {
    id: 'dem-imp',
    nameRu: 'Бес (Imp)',
    netActions: 2,
    interfaceRank: 4,
    combatStat: 10,
    rezMax: 15,
    descRu: 'Простой сторожевой демон для частных офисов. Управляет камерами и замками.'
  },
  {
    id: 'dem-efreet',
    nameRu: 'Ифрит (Efreet)',
    netActions: 3,
    interfaceRank: 7,
    combatStat: 14,
    rezMax: 25,
    descRu: 'Корпоративный охранный ИИ. Активирует автоматические турели, тревогу и блокирует лифты.'
  },
  {
    id: 'dem-balron',
    nameRu: 'Балрог (Balron)',
    netActions: 4,
    interfaceRank: 10,
    combatStat: 18,
    rezMax: 35,
    descRu: 'Военный супер-демон максимального уровня защиты. Координирует боевых дронов и ликвидацию нарушителей.'
  }
];
