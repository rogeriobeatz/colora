/**
 * Sistema Centralizado de Configuração CORS
 * 
 * Este arquivo centraliza todas as configurações de CORS para as Edge Functions,
 * facilitando manutenção e garantindo consistência em toda a plataforma.
 */

// Domínios oficiais da plataforma
export const ALLOWED_ORIGINS = [
  // Ambiente de produção
  "https://colora.app.br",
  "https://www.colora.app.br",
  
  // Ambientes de desenvolvimento
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:8082",
  
  // Preview URLs (Lovable)
  "*.lovableproject.com",
  "*.lovable.app",
] as const;

// Headers padrão permitidos
export const DEFAULT_ALLOWED_HEADERS = [
  "authorization",
  "x-client-info", 
  "apikey",
  "content-type",
  "x-supabase-client-platform",
  "x-supabase-client-platform-version", 
  "x-supabase-client-runtime",
  "x-supabase-client-runtime-version",
] as const;

// Headers adicionais para funções específicas
export const EXTENDED_ALLOWED_HEADERS = [
  ...DEFAULT_ALLOWED_HEADERS,
  "stripe-signature", // Para webhooks do Stripe
] as const;

// Métodos HTTP permitidos
export const ALLOWED_METHODS = [
  "GET",
  "POST", 
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
] as const;

// Headers CORS base
export const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
  "Vary": "Origin",
} as const;

/**
 * Verifica se uma origem é permitida
 */
export const isAllowedOrigin = (origin: string): boolean => {
  if (!origin) return false;
  
  // Verifica domínios exatos
  if (ALLOWED_ORIGINS.includes(origin as any)) {
    return true;
  }
  
  // Verifica wildcards (*.lovableproject.com, *.lovable.app)
  for (const allowed of ALLOWED_ORIGINS) {
    if (allowed.startsWith("*.")) {
      const domain = allowed.slice(2); // Remove "*."
      if (origin.endsWith(domain) && origin.includes(domain)) {
        return true;
      }
    }
  }
  
  // Verifica localhost com qualquer porta
  if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
    return true;
  }
  
  return false;
};

/**
 * Gera headers CORS dinâmicos baseados na requisição
 */
export const generateCorsHeaders = (req: Request, options: {
  allowCredentials?: boolean;
  customHeaders?: string[];
  maxAge?: number;
} = {}) => {
  const origin = req.headers.get("Origin") || "";
  const {
    allowCredentials = false,
    customHeaders = [],
    maxAge = 86400, // 24 horas
  } = options;
  
  // Headers permitidos (padrão + customizados)
  const allowedHeaders = [...DEFAULT_ALLOWED_HEADERS, ...customHeaders];
  
  // Determina a origem permitida
  const allowedOrigin = isAllowedOrigin(origin) ? origin : "https://colora.app.br";
  
  // Constrói headers CORS
  const headers: Record<string, string> = {
    ...BASE_CORS_HEADERS,
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": allowedHeaders.join(", "),
    "Access-Control-Max-Age": maxAge.toString(),
  };
  
  // Adiciona credenciais se necessário
  if (allowCredentials) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  
  return headers;
};

/**
 * Headers CORS para funções com Stripe
 */
export const generateStripeCorsHeaders = (req: Request) => {
  return generateCorsHeaders(req, {
    customHeaders: ["stripe-signature"],
    allowCredentials: true,
  });
};

/**
 * Headers CORS para funções simples (sem Stripe)
 */
export const generateSimpleCorsHeaders = (req: Request) => {
  return generateCorsHeaders(req);
};

/**
 * Resposta CORS para requisições OPTIONS
 */
export const createCorsResponse = (req: Request, options?: Parameters<typeof generateCorsHeaders>[1]) => {
  const headers = generateCorsHeaders(req, options);
  return new Response(null, { headers });
};

/**
 * Adiciona headers CORS a uma resposta existente
 */
export const addCorsHeaders = (response: Response, req: Request, options?: Parameters<typeof generateCorsHeaders>[1]) => {
  const corsHeaders = generateCorsHeaders(req, options);
  
  // Cria nova resposta com headers CORS
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};
