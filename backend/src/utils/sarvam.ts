import WebSocket from "ws";
import { logger } from "./logger";

const SARVAM_WS_URL = "wss://api.sarvam.ai/speech-to-text-translate/ws";
const SARVAM_API_KEY = process.env.SARVAM_API_KEY ?? "";
const TIMEOUT_MS = 10_000;

export type SarvamErrorCode = "MISSING_API_KEY" | "CONNECTION_REFUSED" | "TIMEOUT" | "BAD_AUDIO" | "UNKNOWN";

export class SarvamError extends Error {
  code: SarvamErrorCode;
  constructor(message: string, code: SarvamErrorCode = "UNKNOWN") {
    super(message);
    this.name = "SarvamError";
    this.code = code;
  }
}

export async function transcribeAndTranslate(audioBase64: string): Promise<string> {
  if (!SARVAM_API_KEY) {
    throw new SarvamError("SARVAM_API_KEY is not configured on the server", "MISSING_API_KEY");
  }

  logger.debug("sarvam", "Starting", { audioLength: audioBase64.length });

  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      model: "saaras:v3",
      mode: "translate",
      "language-code": "hi-IN",
      high_vad_sensitivity: "true",
      flush_signal: "true",
    });

    let ws: WebSocket;
    try {
      ws = new WebSocket(`${SARVAM_WS_URL}?${params.toString()}`, {
        headers: { "api-subscription-key": SARVAM_API_KEY },
      });
    } catch (err) {
      reject(new SarvamError(`Failed to create WebSocket: ${(err as Error).message}`, "CONNECTION_REFUSED"));
      return;
    }

    let transcript = "";
    let settled = false;

    const done = (err?: SarvamError) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { ws.close(); } catch { /* ignore */ }
      if (err) reject(err);
      else resolve(transcript);
    };

    const timer = setTimeout(() => {
      logger.warn("sarvam", "Timeout", { transcriptSoFar: transcript });
      done(transcript ? undefined : new SarvamError(`Sarvam STT timed out after ${TIMEOUT_MS / 1000}s`, "TIMEOUT"));
    }, TIMEOUT_MS);

    ws.on("open", () => {
      logger.debug("sarvam", "WebSocket opened — sending audio");
      try {
        ws.send(JSON.stringify({
          audio: { data: audioBase64, encoding: "audio/wav", sample_rate: 16000 },
        }));
        ws.send(JSON.stringify({ type: "flush" }));
        logger.debug("sarvam", "Audio + flush sent");

        setTimeout(() => {
          if (!settled) {
            logger.debug("sarvam", "Sending close after flush");
            try { ws.close(1000, "done"); } catch { /* ignore */ }
          }
        }, 3000);
      } catch (err) {
        done(new SarvamError(`Failed to send audio: ${(err as Error).message}`, "BAD_AUDIO"));
      }
    });

    ws.on("message", (raw) => {
      const rawStr = raw.toString();
      logger.debug("sarvam", "Message received", { preview: rawStr.slice(0, 300) });

      try {
        const msg = JSON.parse(rawStr) as Record<string, unknown>;
        const type = msg.type as string | undefined;

        if (type === "error" || msg.error) {
          const errMsg = JSON.stringify(msg);
          logger.error("sarvam", "Error frame from Sarvam", { raw: errMsg });
          done(new SarvamError(`Sarvam rejected the request: ${errMsg}`, "BAD_AUDIO"));
          return;
        }

        const dataPayload = msg.data as Record<string, unknown> | undefined;
        const text = ((dataPayload?.transcript ?? msg.text ?? msg.transcript ?? "") as string).trim();

        if (text) {
          transcript += (transcript ? " " : "") + text;
          logger.debug("sarvam", "Accumulated transcript", { transcript });
        }

        if (type === "data" && text) {
          // accumulate — resolve on close
        } else if (type === "translation" || type === "transcript" || msg.is_final === true) {
          logger.debug("sarvam", "Final message — resolving");
          done();
        }
      } catch {
        logger.warn("sarvam", "Non-JSON frame ignored", { preview: rawStr.slice(0, 100) });
      }
    });

    ws.on("error", (err) => {
      logger.error("sarvam", "WebSocket error", { message: err.message });
      const msg = err.message ?? "";
      const code: SarvamErrorCode = msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")
        ? "CONNECTION_REFUSED" : "UNKNOWN";
      done(new SarvamError(`WebSocket error: ${msg}`, code));
    });

    ws.on("close", (code, reason) => {
      const reasonStr = reason?.toString() ?? "(none)";
      logger.debug("sarvam", "WebSocket closed", { code, reason: reasonStr, transcript });
      if (!settled) {
        if (transcript) {
          done();
        } else {
          done(new SarvamError(
            `WebSocket closed unexpectedly (code ${code}: ${reasonStr})`,
            code === 1008 ? "BAD_AUDIO" : "UNKNOWN"
          ));
        }
      }
    });
  });
}
