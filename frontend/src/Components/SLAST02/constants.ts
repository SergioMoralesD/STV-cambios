// ─── MAPS ──────────────────────────────────────────────────────────────────

export const DELEG_ABREV: Record<string, string> = {
  "6S21": "tf",
  "6S23": "gc",
  "6S24": "lz",
  "6S25": "fv",
  "6S21_MENORES": "im",
  "6E21": "pm",
  "6E22": "ib",
  "6E23": "me",
  "6E41": "ft",
};

export const DELEG_NAME: Record<string, string> = {
  "6S21": "Tenerife",
  "6S23": "Gran Canaria",
  "6S24": "Lanzarote",
  "6S25": "Fuerteventura",
  "6S21_MENORES": "Islas Menores",
  "6E21": "Mallorca",
  "6E22": "Ibiza",
  "6E23": "Menorca",
  "6E41": "Formentera",
};

export const FAMILIA_ROWS: {
  key: keyof import("./types").ContadoresResumen;
  label: string;
  cls: string;
}[] = [
  { key: "DI", label: "DISPENSING",  cls: "colorDispensing" },
  { key: "VI", label: "VITRINA",     cls: "colorVitrina"    },
  { key: "VE", label: "VENDING",     cls: "colorVending"    },
  { key: "BO", label: "BOTELLERO",   cls: "colorBotellero"  },
  { key: "CA", label: "CABEZALES",   cls: "colorCabezales"  },
];

  