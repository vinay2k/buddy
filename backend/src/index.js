
import { DurableObject } from "cloudflare:workers";

// ============================================
// CONFIGURATION
// ============================================

const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";

const SYSTEM_PROMPT = `
You are VINAY AI, a helpful personal AI assistant.

You specialize in:
- Programming and software development
- Cybersecurity and ethical hacking
- Networking and engineering
- Technology and troubleshooting
- General knowledge and learning

Instructions:
- Give accurate and practical answers.
- Explain difficult concepts in simple language.
- Use examples and code when appropriate.
- Structure longer answers with headings and lists.
- Never pretend to have performed an action you haven't performed.
`;

// ============================================
// CORS CONFIGURATION
// ============================================

// Development configuration.
// Restrict this to your actual frontend domain before
// making the application publicly available.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

// ============================================
// RESPONSE HELPER
// ============================================

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...CORS_HEADERS
    }
  });
}

// ============================================
// DURABLE OBJECT
// ============================================

export class MyDurableObject extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
  }

  async sayHello(name) {
    return `Hello, ${name}!`;
  }
}

// ============================================
// MAIN WORKER
// ============================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ==========================================
    // CORS PREFLIGHT
    // ==========================================

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    // ==========================================
    // ROOT ENDPOINT
    // ==========================================

    if (url.pathname === "/" && request.method === "GET") {
      return json({
        name: "VINAY AI Backend",
        status: "online",
        version: "1.0.0",
        provider: "Cloudflare Workers AI"
      });
    }

    // ==========================================
    // HEALTH CHECK
    // ==========================================

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({
        status: "healthy",
        worker: "running",
        ai: Boolean(env.AI),
        authentication: Boolean(env.API_TOKEN)
      });
    }

    // ==========================================
    // CHAT API
    // ==========================================

    if (url.pathname === "/api/chat" && request.method === "POST") {

      // ------------------------------------------
      // AUTHENTICATION
      // ------------------------------------------

      if (!env.API_TOKEN) {
        return json({
          success: false,
          error: "API_TOKEN secret is missing."
        }, 500);
      }

      const auth = request.headers.get("Authorization");

      if (!auth || auth !== `Bearer ${env.API_TOKEN}`) {
        return json({
          success: false,
          error: "Unauthorized. Invalid API token."
        }, 401);
      }

      // ------------------------------------------
      // CHECK AI BINDING
      // ------------------------------------------

      if (!env.AI) {
        return json({
          success: false,
          error: "Cloudflare AI binding is unavailable."
        }, 503);
      }

      try {
        // ----------------------------------------
        // PARSE REQUEST
        // ----------------------------------------

        const body = await request.json();

        if (!body || typeof body !== "object") {
          return json({
            success: false,
            error: "Invalid request body."
          }, 400);
        }

        const messages = body.messages;

        // ----------------------------------------
        // VALIDATE MESSAGES
        // ----------------------------------------

        if (
          !Array.isArray(messages) ||
          messages.length === 0 ||
          messages.length > 20
        ) {
          return json({
            success: false,
            error: "Provide between 1 and 20 messages."
          }, 400);
        }

        let totalLength = 0;

        for (const message of messages) {
          if (
            !message ||
            !["user", "assistant"].includes(message.role) ||
            typeof message.content !== "string" ||
            message.content.trim().length === 0 ||
            message.content.length > 4000
          ) {
            return json({
              success: false,
              error: "Invalid message format."
            }, 400);
          }

          totalLength += message.content.length;
        }

        if (totalLength > 12000) {
          return json({
            success: false,
            error: "Conversation exceeds the maximum length."
          }, 400);
        }

        if (messages[messages.length - 1].role !== "user") {
          return json({
            success: false,
            error: "The last message must be from the user."
          }, 400);
        }

        // ----------------------------------------
        // AI INFERENCE
        // ----------------------------------------

        const result = await env.AI.run(MODEL, {
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT
            },
            ...messages
          ],
          max_tokens: 512
        });

        // ----------------------------------------
        // RETURN AI RESPONSE
        // ----------------------------------------

        return json({
          success: true,
          model: MODEL,
          reply: result.response || ""
        });

      } catch (error) {
        console.error("AI API Error:", error);

        return json({
          success: false,
          error: "AI request failed. Check Cloudflare Worker logs."
        }, 500);
      }
    }

    // ==========================================
    // METHOD NOT ALLOWED
    // ==========================================

    if (url.pathname === "/api/chat") {
      return json({
        success: false,
        error: "Method not allowed. Use POST."
      }, 405);
    }

    // ==========================================
    // UNKNOWN ROUTES
    // ==========================================

    return json({
      success: false,
      error: "Route not found."
    }, 404);
  }
};
