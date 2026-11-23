/** Normalise les erreurs de connexion sans jamais conserver ni afficher le mot de passe. */
export type PasswordLoginResult =
  | { ok: true }
  | {
      ok: false;
      reason: "unconfirmed" | "invalid" | "rate_limit" | "unavailable" | "network";
    };

type Credentials = { email: string; password: string };
type LoginError = { message: string; status?: number; code?: string };
type PasswordLoginSender = (credentials: Credentials) => Promise<{ error: LoginError | null }>;

export async function attemptPasswordLogin(
  signIn: PasswordLoginSender,
  credentials: Credentials,
): Promise<PasswordLoginResult> {
  try {
    const { error } = await signIn(credentials);
    if (!error) return { ok: true };

    const message = error.message.toLowerCase();
    if (error.code === "email_not_confirmed" || message.includes("not confirmed")) {
      return { ok: false, reason: "unconfirmed" };
    }
    if (error.code === "invalid_credentials" || message.includes("invalid login credentials")) {
      return { ok: false, reason: "invalid" };
    }
    if (error.status === 429 || error.code === "over_request_rate_limit") {
      return { ok: false, reason: "rate_limit" };
    }
    return { ok: false, reason: "unavailable" };
  } catch {
    return { ok: false, reason: "network" };
  }
}
