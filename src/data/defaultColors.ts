export type PaintFinish = "fosco" | "acetinado" | "semibrilho";

export interface Paint {
  id: string;
  name: string;
  code: string;
  hex: string;
  rgb: string;
  cmyk: string;
  category: string;
  subcategory?: string;
  finish: PaintFinish;
}

export interface Catalog {
  id: string;
  name: string;
  active: boolean;
  paints: Paint[];
  description?: string;
  logo_url?: string;
}

export type HeaderContentMode = "logo+name" | "logo" | "name";
export type HeaderStyleMode = "glass" | "gradient" | "card" | "minimal" | "primary" | "white" | "white-accent";
export type FontSet = "grotesk" | "rounded" | "neo" | "technical";

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
  border_radius?: "square" | "rounded" | "soft";

  // Sistema de Tokens
  tokens: number;
  tokensExpiresAt: string | null;
  subscriptionStatus: 'active' | 'inactive';
  lastTokenDeposit: string | null;
  accountType: 'trial' | 'subscriber' | 'churned';

  // Documento da empresa
  documentNumber?: string;

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

function createPaint(name: string, code: string, hex: string, category: string, finish: PaintFinish = "fosco"): Paint {
  return { id: genId(), name, code, hex, rgb: hexToRgb(hex), cmyk: hexToCmyk(hex), category, finish };
}

export const defaultPaints: Paint[] = [
  // Brancos e Neutros - Fosco
  createPaint("Branco Neve (Fosco)", "BN-F01", "#FFFFFF", "Brancos e Neutros", "fosco"),
  createPaint("Branco Gelo (Fosco)", "BN-F02", "#F5F5F0", "Brancos e Neutros", "fosco"),
  // Brancos e Neutros - Acetinado
  createPaint("Branco Seda (Acetinado)", "BN-A01", "#FFFFFF", "Brancos e Neutros", "acetinado"),
  createPaint("Pérola (Acetinado)", "BN-A02", "#EAE0C8", "Brancos e Neutros", "acetinado"),
  // Brancos e Neutros - Semibrilho
  createPaint("Branco Cristal (Semibrilho)", "BN-S01", "#FFFFFF", "Brancos e Neutros", "semibrilho"),
  
  // Cinzas - Fosco
  createPaint("Cinza Prata (Fosco)", "CZ-F01", "#C0C0C0", "Cinzas", "fosco"),
  createPaint("Cinza Grafite (Fosco)", "CZ-F02", "#696969", "Cinzas", "fosco"),
  // Cinzas - Acetinado
  createPaint("Cinza Urbano (Acetinado)", "CZ-A01", "#D3D3D3", "Cinzas", "acetinado"),
  createPaint("Chumbo (Acetinado)", "CZ-A02", "#4A4A4A", "Cinzas", "acetinado"),
  
  // Amarelos e Laranjas
  createPaint("Amarelo Sol (Fosco)", "AM-F01", "#FFD700", "Amarelos", "fosco"),
  createPaint("Vanilla (Acetinado)", "AM-A01", "#FFF5D6", "Amarelos", "acetinado"),
  createPaint("Terracota (Fosco)", "LR-F01", "#CC6633", "Laranjas", "fosco"),
  createPaint("Coral (Acetinado)", "LR-A01", "#FF6F61", "Laranjas", "acetinado"),
  
  // Vermelhos e Rosas
  createPaint("Vermelho Paixão (Fosco)", "VM-F01", "#CC0000", "Vermelhos", "fosco"),
  createPaint("Vinho (Semibrilho)", "VM-S01", "#722F37", "Vermelhos", "semibrilho"),
  createPaint("Rosa Blush (Acetinado)", "RS-A01", "#F4C2C2", "Rosas", "acetinado"),
  
  // Azuis
  createPaint("Azul Céu (Fosco)", "AZ-F01", "#87CEEB", "Azuis", "fosco"),
  createPaint("Azul Marinho (Acetinado)", "AZ-A01", "#000080", "Azuis", "acetinado"),
  createPaint("Azul Petróleo (Semibrilho)", "AZ-S01", "#2A5F7E", "Azuis", "semibrilho"),
  
  // Verdes
  createPaint("Verde Menta (Fosco)", "VD-F01", "#98FB98", "Verdes", "fosco"),
  createPaint("Verde Oliva (Acetinado)", "VD-A01", "#6B8E23", "Verdes", "acetinado"),
  createPaint("Verde Esmeralda (Semibrilho)", "VD-S01", "#50C878", "Verdes", "semibrilho"),
  createPaint("Verde Sage (Fosco)", "VD-F02", "#BCB88A", "Verdes", "fosco"),
  
  // Marrons e Tons Escuros
  createPaint("Marrom Café (Fosco)", "MR-F01", "#6F4E37", "Marrons", "fosco"),
  createPaint("Caramelo (Acetinado)", "MR-A01", "#C68E17", "Marrons", "acetinado"),
  createPaint("Preto Absoluto (Fosco)", "PR-F01", "#000000", "Tons Escuros", "fosco"),
  createPaint("Preto Onix (Semibrilho)", "PR-S01", "#1A1A1A", "Tons Escuros", "semibrilho"),
];

export function createDefaultCatalog(): Catalog {
  return {
    id: genId(),
    name: "Cores Básicas",
    active: true,
    paints: [...defaultPaints],
    description: "Catálogo padrão com cores básicas para simulação"
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

    // Sistema de Tokens
    tokens: 0,
    tokensExpiresAt: null,
    subscriptionStatus: 'inactive',
    lastTokenDeposit: null,
    accountType: 'trial',
  };
}