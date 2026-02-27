export const corsHeaders = (req: Request) => {
  const origin = req.headers.get("Origin");
  const allowedOrigins = [
    "https://colora.rogerio.work",
    "https://colora.app.br",
    "http://localhost:3000",
    "http://localhost:5173",
  ];

  const responseOrigin = allowedOrigins.includes(origin || "")
    ? origin
    : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": responseOrigin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
};
