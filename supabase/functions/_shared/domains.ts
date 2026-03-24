/**
 * Sistema Centralizado de Configuração de Domínios
 * 
 * Este arquivo centraliza todas as configurações de domínios da plataforma,
 * facilitando manutenção e garantindo consistência em toda a aplicação.
 */

// Domínios oficiais da plataforma
export const DOMAINS = {
  // Ambiente de produção
  PRODUCTION: "https://colora.app.br",
  PRODUCTION_WWW: "https://www.colora.app.br",
  
  // Ambiente de desenvolvimento (localhost)
  LOCALHOST: "http://localhost:3000",
  LOCALHOST_ALT: "http://localhost:5173",
  LOCALHOST_IP: "http://127.0.0.1:3000",
  LOCALHOST_IP_ALT: "http://127.0.0.1:5173",
  
  // Preview URLs (Lovable)
  LOVABLE_PROJECT: "*.lovableproject.com",
  LOVABLE_APP: "*.lovable.app",
} as const;

// Lista de todos os domínios permitidos
export const ALLOWED_DOMAINS = [
  DOMAINS.PRODUCTION,
  DOMAINS.PRODUCTION_WWW,
  DOMAINS.LOCALHOST,
  DOMAINS.LOCALHOST_ALT,
  DOMAINS.LOCALHOST_IP,
  DOMAINS.LOCALHOST_IP_ALT,
  DOMAINS.LOVABLE_PROJECT,
  DOMAINS.LOVABLE_APP,
] as const;

/**
 * Verifica se um domínio é permitido
 */
export const isAllowedDomain = (domain: string): boolean => {
  if (!domain) return false;
  
  // Verifica domínios exatos
  if (ALLOWED_DOMAINS.includes(domain as any)) {
    return true;
  }
  
  // Verifica wildcards (*.lovableproject.com, *.lovable.app)
  for (const allowed of ALLOWED_DOMAINS) {
    if (allowed.startsWith("*.")) {
      const baseDomain = allowed.slice(2); // Remove "*."
      if (domain.endsWith(baseDomain) && domain.includes(baseDomain)) {
        return true;
      }
    }
  }
  
  // Verifica localhost com qualquer porta
  if (domain.startsWith("http://localhost:") || domain.startsWith("http://127.0.0.1:")) {
    return true;
  }
  
  return false;
};

/**
 * Obtém o domínio padrão para fallback
 */
export const getDefaultDomain = (): string => DOMAINS.PRODUCTION;

/**
 * Verifica se é ambiente de desenvolvimento
 */
export const isDevelopmentDomain = (domain: string): boolean => {
  return domain.includes("localhost") || domain.includes("127.0.0.1");
};

/**
 * Verifica se é ambiente de produção
 */
export const isProductionDomain = (domain: string): boolean => {
  return domain === DOMAINS.PRODUCTION;
};

/**
 * Obtém o domínio apropriado baseado no contexto
 */
export const getDomainForContext = (origin?: string): string => {
  if (!origin) return getDefaultDomain();
  
  // Se a origem for permitida, usa ela mesma
  if (isAllowedDomain(origin)) {
    return origin;
  }
  
  // Se não for permitida, usa o padrão de produção
  return getDefaultDomain();
};

/**
 * URLs específicas da plataforma
 */
export const PLATFORM_URLS = {
  // Dashboard principal
  DASHBOARD: (domain?: string) => `${getDomainForContext(domain)}/dashboard`,
  
  // Simulador
  SIMULATOR: (domain?: string) => `${getDomainForContext(domain)}/simulator`,
  
  // Página de checkout
  CHECKOUT: (domain?: string) => `${getDomainForContext(domain)}/checkout`,
  
  // Página de sucesso
  CHECKOUT_SUCCESS: (domain?: string) => `${getDomainForContext(domain)}/checkout/sucesso`,
  
  // Página pública da empresa
  COMPANY_PUBLIC: (slug: string, domain?: string) => `${getDomainForContext(domain)}/empresa/${slug}`,
  
  // Login
  LOGIN: (domain?: string) => `${getDomainForContext(domain)}/login`,
  
  // Registro
  REGISTER: (domain?: string) => `${getDomainForContext(domain)}/register`,
} as const;

/**
 * Configurações de email
 */
export const EMAIL_CONFIG = {
  FROM: {
    NO_REPLY: `Colora <noreply@colora.app.br>`,
    SUPPORT: `Colora <suporte@colora.app.br>`,
  },
  
  REPLY_TO: {
    SUPPORT: "suporte@colora.app.br",
    NO_REPLY: "noreply@colora.app.br",
  },
} as const;

/**
 * Gera URLs para emails
 */
export const EMAIL_URLS = {
  DASHBOARD: PLATFORM_URLS.DASHBOARD(),
  SIMULATOR: PLATFORM_URLS.SIMULATOR(),
  LOGIN: PLATFORM_URLS.LOGIN(),
} as const;
