import { describe, expect, it } from "vitest";
import { attemptPasswordLogin } from "./password-login";

const credentials = { email: "test@example.invalid", password: "not-a-real-password" };

describe("tentative de connexion Supabase", () => {
  it("accepte la connexion quand Supabase ne renvoie pas d'erreur", async () => {
    const result = await attemptPasswordLogin(async () => ({ error: null }), credentials);
    expect(result).toEqual({ ok: true });
  });

  it("signale un mot de passe incorrect sans exposer l'erreur brute", async () => {
    const result = await attemptPasswordLogin(
      async () => ({
        error: { message: "Invalid login credentials", code: "invalid_credentials" },
      }),
      credentials,
    );
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("identifie les comptes non confirmés", async () => {
    const result = await attemptPasswordLogin(
      async () => ({ error: { message: "Email not confirmed", code: "email_not_confirmed" } }),
      credentials,
    );
    expect(result).toEqual({ ok: false, reason: "unconfirmed" });
  });

  it("signale la limitation de débit", async () => {
    const result = await attemptPasswordLogin(
      async () => ({ error: { message: "Too many requests", status: 429 } }),
      credentials,
    );
    expect(result).toEqual({ ok: false, reason: "rate_limit" });
  });

  it("sort de l'attente si la requête réseau rejette", async () => {
    const result = await attemptPasswordLogin(async () => {
      throw new Error("Failed to fetch");
    }, credentials);
    expect(result).toEqual({ ok: false, reason: "network" });
  });

  it("masque les erreurs serveur inconnues", async () => {
    const result = await attemptPasswordLogin(
      async () => ({ error: { message: "Internal details" } }),
      credentials,
    );
    expect(result).toEqual({ ok: false, reason: "unavailable" });
  });
});
