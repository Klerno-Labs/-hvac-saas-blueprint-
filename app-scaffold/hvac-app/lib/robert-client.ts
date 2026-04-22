/**
 * FieldClose satellite → Robert: signed write client.
 *
 * Server-only. POSTs to Robert's satellite event endpoints with the
 * shared HMAC signature contract:
 *
 *   X-Robert-App-Slug:   <slug>
 *   X-Robert-Signature:  t=<unix_seconds>,v1=<hmac_hex>
 *   mac = HMAC_SHA256(Buffer.from(secretHex, "hex"),
 *                     `${ts}.${rawBody}`)
 *
 * Env resolution (preferred → fallback):
 *   - url:    ROBERT_API_URL         (required)
 *   - slug:   ROBERT_APP_SLUG        → "fieldclose"
 *   - secret: ROBERT_APP_SECRET      → FIELDCLOSE_APP_SECRET
 */

import "server-only";
import { createHmac } from "node:crypto";

const DEFAULT_SLUG = "fieldclose";

export interface RobertSendResult {
  ok: boolean;
  status: number;
  reason?: string;
}

function readSlug(): string {
  return process.env.ROBERT_APP_SLUG ?? DEFAULT_SLUG;
}

function readApiUrl(): string {
  const v = process.env.ROBERT_API_URL;
  if (!v || v.length === 0) {
    throw new Error("[robert-client] ROBERT_API_URL is not set");
  }
  return v.replace(/\/+$/, "");
}

function readSecret(): string {
  const v = process.env.ROBERT_APP_SECRET ?? process.env.FIELDCLOSE_APP_SECRET;
  if (!v || v.length === 0) {
    throw new Error("[robert-client] ROBERT_APP_SECRET is not set");
  }
  if (!/^[0-9a-f]+$/i.test(v) || v.length !== 64) {
    throw new Error(
      `[robert-client] ROBERT_APP_SECRET is not a valid 32-byte hex string (length ${v.length})`,
    );
  }
  return v;
}

function sign(rawBody: string, secretHex: string): string {
  const ts = Math.floor(Date.now() / 1000);
  const mac = createHmac("sha256", Buffer.from(secretHex, "hex"))
    .update(`${ts}.${rawBody}`)
    .digest("hex");
  return `t=${ts},v1=${mac}`;
}

async function send(path: string, payload: unknown): Promise<RobertSendResult> {
  let apiUrl: string;
  let slug: string;
  let secret: string;
  try {
    apiUrl = readApiUrl();
    slug = readSlug();
    secret = readSecret();
  } catch (err) {
    return { ok: false, status: 0, reason: err instanceof Error ? err.message : "env-misconfigured" };
  }

  const rawBody = JSON.stringify(payload);
  const signature = sign(rawBody, secret);

  try {
    const res = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Robert-App-Slug": slug,
        "X-Robert-Signature": signature,
      },
      body: rawBody,
      signal: AbortSignal.timeout(5_000),
    });
    return { ok: res.ok, status: res.status, reason: res.ok ? undefined : `http_${res.status}` };
  } catch (err) {
    return { ok: false, status: 0, reason: err instanceof Error ? err.message : "fetch-failed" };
  }
}

export async function heartbeat(
  status: "ok" | "degraded" | "error" = "ok",
  error?: string,
): Promise<RobertSendResult> {
  const payload: { status: string; error?: string } = { status };
  if (error) payload.error = error.slice(0, 500);
  return send("/api/satellites/health", payload);
}

export async function emitEvent(input: {
  eventId: string;
  type: string;
  occurredAt?: string;
  payload: Record<string, unknown>;
}): Promise<RobertSendResult> {
  return send("/api/satellites/events", {
    eventId: input.eventId,
    type: input.type,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    payload: input.payload,
  });
}
