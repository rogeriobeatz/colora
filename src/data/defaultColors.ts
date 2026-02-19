export interface Paint {
  id: string;
  name: string;
  code: string;
  hex: string;
  rgb: string;
  cmyk: string;
  category: string;
}

export interface Catalog {
  id: string;
  name: string;
  active: boolean;
  paints: Paint[];
}

export type HeaderContentMode = "logo+name" | "logo" | "name";
export type HeaderStyleMode = "glass" | "primary" | "white" | "white-accent";
export type FontSet = "grotesk" | "rounded" | "neo";

export interface CropCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  catalogs: Catalog[];

  // Dados públicos da empresa (para rodapé/contato)
  phone?: string;
  website?: string;
  address?: string;

  // Preferências de aparência
  headerContent?: HeaderContentMode;
  headerStyle?: HeaderStyleMode;
  fontSet?: FontSet;

  // Coordenadas de crop da imagem principal (logo)
  logoCrop?: CropCoordinates;
}

const genId = () => Math.random().toString(36).substring(2, 10);

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function hexToCmyk(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return "0, 0, 0, 100";
  const c = Math.round(((1 - r - k) / (1 - k)) * 100);
  const m = Math.round(((1 - g - k) / (1 - k)) * 100);
  const y = Math.round(((1 - b - k) / (1 - k)) * 100);
  return `${c}, ${m}, ${y}, ${Math.round(k * 100)}`;
}

function createPaint(name: string, code: string, hex: string, category: string): Paint {
  return { id: genId(), name, code, hex, rgb: hexToRgb(hex), cmyk: hexToCmyk(hex), category };
}

export const defaultPaints: Paint[] = [
  // Brancos e Neutros
  createPaint("Branco Neve", "BN-001", "#FFFFFF", "Brancos e Neutros"),
  createPaint("Branco Gelo", "BN-002", "#F5F5F0", "Brancos e Neutros"),
  createPaint("Marfim", "BN-003", "#FFFFF0", "Brancos e Neutros"),
  createPaint("Pérola", "BN-004", "#EAE0C8", "Brancos e Neutros"),
  createPaint("Linho", "BN-005", "#FAF0E6", "Brancos e Neutros"),
  createPaint("Algodão", "BN-006", "#F2E8DC", "Brancos e Neutros"),
  createPaint("Areia Clara", "BN-007", "#E8DCC8", "Brancos e Neutros"),
  // Cinzas
  createPaint("Cinza Claro", "CZ-001", "#D3D3D3", "Cinzas"),
  createPaint("Cinza Prata", "CZ-002", "#C0C0C0", "Cinzas"),
  createPaint("Cinza Médio", "CZ-003", "#A9A9A9", "Cinzas"),
  createPaint("Cinza Grafite", "CZ-004", "#696969", "Cinzas"),
  createPaint("Cinza Chumbo", "CZ-005", "#4A4A4A", "Cinzas"),
  createPaint("Concreto", "CZ-006", "#B8B8AA", "Cinzas"),
  // Amarelos
  createPaint("Amarelo Sol", "AM-001", "#FFD700", "Amarelos"),
  createPaint("Amarelo Claro", "AM-002", "#FFEC8B", "Amarelos"),
  createPaint("Mostarda", "AM-003", "#E3A857", "Amarelos"),
  createPaint("Mel", "AM-004", "#D4A843", "Amarelos"),
  createPaint("Vanilla", "AM-005", "#FFF5D6", "Amarelos"),
  createPaint("Girassol", "AM-006", "#FFBA00", "Amarelos"),
  // Laranjas
  createPaint("Laranja Vibrante", "LR-001", "#FF7F24", "Laranjas"),
  createPaint("Terracota", "LR-002", "#CC6633", "Laranjas"),
  createPaint("Pêssego", "LR-003", "#FFDAB9", "Laranjas"),
  createPaint("Salmão", "LR-004", "#FA8072", "Laranjas"),
  createPaint("Coral", "LR-005", "#FF6F61", "Laranjas"),
  // Vermelhos
  createPaint("Vermelho Paixão", "VM-001", "#CC0000", "Vermelhos"),
  createPaint("Vermelho Clássico", "VM-002", "#DC143C", "Vermelhos"),
  createPaint("Bordô", "VM-003", "#800020", "Vermelhos"),
  createPaint("Vinho", "VM-004", "#722F37", "Vermelhos"),
  createPaint("Cereja", "VM-005", "#DE3163", "Vermelhos"),
  createPaint("Rosa Antigo", "VM-006", "#BC8F8F", "Vermelhos"),
  // Rosas
  createPaint("Rosa Claro", "RS-001", "#FFB6C1", "Rosas"),
  createPaint("Rosa Blush", "RS-002", "#F4C2C2", "Rosas"),
  createPaint("Rosa Quartz", "RS-003", "#F7CAC9", "Rosas"),
  createPaint("Magenta Suave", "RS-004", "#DB7093", "Rosas"),
  createPaint("Lavanda Rosa", "RS-005", "#E8CFCF", "Rosas"),
  // Azuis
  createPaint("Azul Céu", "AZ-001", "#87CEEB", "Azuis"),
  createPaint("Azul Serenidade", "AZ-002", "#91A8D0", "Azuis"),
  createPaint("Azul Royal", "AZ-003", "#4169E1", "Azuis"),
  createPaint("Azul Marinho", "AZ-004", "#000080", "Azuis"),
  createPaint("Azul Petróleo", "AZ-005", "#2A5F7E", "Azuis"),
  createPaint("Azul Bebê", "AZ-006", "#BCD4E6", "Azuis"),
  createPaint("Azul Acinzentado", "AZ-007", "#8DA9C4", "Azuis"),
  // Verdes
  createPaint("Verde Menta", "VD-001", "#98FB98", "Verdes"),
  createPaint("Verde Oliva", "VD-002", "#6B8E23", "Verdes"),
  createPaint("Verde Floresta", "VD-003", "#228B22", "Verdes"),
  createPaint("Verde Esmeralda", "VD-004", "#50C878", "Verdes"),
  createPaint("Verde Musgo", "VD-005", "#8A9A5B", "Verdes"),
  createPaint("Verde Sage", "VD-006", "#BCB88A", "Verdes"),
  createPaint("Verde Água", "VD-007", "#66CDAA", "Verdes"),
  // Marrons e Terrosos
  createPaint("Marrom Café", "MR-001", "#6F4E37", "Marrons"),
  createPaint("Chocolate", "MR-002", "#7B3F00", "Marrons"),
  createPaint("Caramelo", "MR-003", "#C68E17", "Marrons"),
  createPaint("Castanho", "MR-004", "#8B4513", "Marrons"),
  createPaint("Bege Escuro", "MR-005", "#C8AD7F", "Marrons"),
  createPaint("Argila", "MR-006", "#B66A50", "Marrons"),
  // Tons Escuros
  createPaint("Preto Fosco", "PR-001", "#1A1A1A", "Tons Escuros"),
  createPaint("Preto Absoluto", "PR-002", "#000000", "Tons Escuros"),
  createPaint("Noite", "PR-003", "#191970", "Tons Escuros"),
  createPaint("Carvão", "PR-004", "#36454F", "Tons Escuros"),
  // Roxos e Lilases
  createPaint("Lilás Suave", "RX-001", "#DCD0FF", "Roxos e Lilases"),
  createPaint("Lavanda", "RX-002", "#E6E6FA", "Roxos e Lilases"),
  createPaint("Uva", "RX-003", "#6C3461", "Roxos e Lilases"),
  createPaint("Ameixa", "RX-004", "#8E4585", "Roxos e Lilases"),
];

export function createDefaultCatalog(): Catalog {
  return {
    id: genId(),
    name: "Cores Básicas",
    active: true,
    paints: [...defaultPaints],
  };
}

export function createDefaultCompany(name: string): Company {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return {
    id: genId(),
    name,
    slug,
    primaryColor: "#1a8a6a",
    secondaryColor: "#e87040",
    catalogs: [createDefaultCatalog()],

    phone: "",
    website: "",
    address: "",

    headerContent: "logo+name",
    headerStyle: "glass",
    fontSet: "grotesk",
  };
}