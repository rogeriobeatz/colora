/**
 * @deprecated Use generateCorsHeaders from cors-config.ts instead
 * This file is kept for backward compatibility
 */
import { generateCorsHeaders } from "./cors-config.ts";

export const corsHeaders = (req: Request) => {
  return generateCorsHeaders(req);
};
