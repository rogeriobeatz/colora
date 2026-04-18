import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  // Esta função ajuda a debuggar - mostra o auth header recebido
  const authHeader = req.headers.get("Authorization");
  
  return new Response(JSON.stringify({ 
    authHeader: authHeader || "null",
    hasAuth: !!authHeader,
    tokenPreview: authHeader?.replace("Bearer ", "").substring(0, 30) + "..." || "null"
  }), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, content-type"
    }
  });
});
