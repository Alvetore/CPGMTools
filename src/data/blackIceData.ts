import { BlackIceProgram } from '../types/netrun';

// Corebook pp. 204–212, 373–375.
export const OFFICIAL_BLACK_ICE: BlackIceProgram[] = [
  {
    "id": "bi-hellhound",
    "nameRu": "Адская гончая (Hellhound)",
    "nameEn": "Hellhound",
    "category": "Anti-Personnel",
    "spd": 6,
    "atk": 6,
    "def": 2,
    "rezMax": 20,
    "effectRu": "2d6 урона мозгу. Без Insulated Wiring загораются дека и одежда: 2 HP в конце каждого хода, пока не потратить Meat Action на тушение. Горение не суммируется.",
    "per": 6
  },
  {
    "id": "bi-asp",
    "nameRu": "Аспид (Asp)",
    "nameEn": "Asp",
    "category": "Anti-Personnel",
    "spd": 6,
    "atk": 2,
    "def": 2,
    "rezMax": 15,
    "effectRu": "Уничтожает одну случайную программу, установленную в деке нетраннера.",
    "per": 4
  },
  {
    "id": "bi-scorpion",
    "nameRu": "Скорпион (Scorpion)",
    "nameEn": "Scorpion",
    "category": "Anti-Personnel",
    "spd": 6,
    "atk": 2,
    "def": 2,
    "rezMax": 15,
    "effectRu": "REF нетраннера снижается на 1d6 на час (минимум 1).",
    "per": 2
  },
  {
    "id": "bi-raven",
    "nameRu": "Ворон (Raven)",
    "nameEn": "Raven",
    "category": "Anti-Personnel",
    "spd": 4,
    "atk": 4,
    "def": 2,
    "rezMax": 15,
    "effectRu": "Derezz одной случайной активной Defender-программы, затем 1d6 урона мозгу.",
    "per": 6
  },
  {
    "id": "bi-skunk",
    "nameRu": "Скунс (Skunk)",
    "nameEn": "Skunk",
    "category": "Anti-Personnel",
    "spd": 4,
    "atk": 4,
    "def": 2,
    "rezMax": 10,
    "effectRu": "−2 к Slide, пока Skunk не Derezzed. Один Skunk влияет на одного нетраннера; разные Skunk суммируются.",
    "per": 2
  },
  {
    "id": "bi-kraken",
    "nameRu": "Кракен (Kraken)",
    "nameEn": "Kraken",
    "category": "Anti-Personnel",
    "spd": 2,
    "atk": 8,
    "def": 4,
    "rezMax": 30,
    "effectRu": "3d6 урона мозгу. До конца следующего хода нельзя двигаться глубже или безопасно Jack Out. Unsafe Jack Out остаётся доступен.",
    "per": 6
  },
  {
    "id": "bi-giant",
    "nameRu": "Гигант (Giant)",
    "nameEn": "Giant",
    "category": "Anti-Personnel",
    "spd": 2,
    "atk": 8,
    "def": 4,
    "rezMax": 25,
    "effectRu": "3d6 урона мозгу и принудительный Unsafe Jack Out: эффекты встреченного активного вражеского ICE, кроме Giant.",
    "per": 2
  },
  {
    "id": "bi-dragon",
    "nameRu": "Дракон (Dragon)",
    "nameEn": "Dragon",
    "category": "Anti-Program",
    "spd": 4,
    "atk": 6,
    "def": 6,
    "rezMax": 30,
    "effectRu": "6d6 урона программе. При Derezz программа уничтожается.",
    "per": 6
  }
];

export const DEMON_PROGRAMS = [
  {
    "id": "dem-imp",
    "nameRu": "Бес (Imp)",
    "netActions": 2,
    "interfaceRank": 3,
    "combatStat": 14,
    "rezMax": 15,
    "descRu": "Простой сторожевой демон для частных офисов. Управляет камерами и замками."
  },
  {
    "id": "dem-efreet",
    "nameRu": "Ифрит (Efreet)",
    "netActions": 3,
    "interfaceRank": 4,
    "combatStat": 14,
    "rezMax": 25,
    "descRu": "Корпоративный охранный ИИ. Активирует автоматические турели, тревогу и блокирует лифты."
  },
  {
    "id": "dem-balron",
    "nameRu": "Балрог (Balron)",
    "netActions": 4,
    "interfaceRank": 7,
    "combatStat": 14,
    "rezMax": 30,
    "descRu": "Военный супер-демон максимального уровня защиты. Координирует боевых дронов и ликвидацию нарушителей."
  }
];
