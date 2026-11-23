import { describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { createSessionBootstrap } from "./session-bootstrap";

const oldSession = { access_token: "old-fake-token" } as Session;
const newSession = { access_token: "new-fake-token" } as Session;

describe("initialisation de session Auth", () => {
  it("accepte la session initiale sans autre événement", () => {
    const apply = vi.fn();
    createSessionBootstrap(apply).onBootstrapSession(oldSession);
    expect(apply).toHaveBeenCalledWith(oldSession);
  });

  it("empêche une réponse getSession tardive d'écraser une nouvelle connexion", () => {
    const apply = vi.fn();
    const bootstrap = createSessionBootstrap(apply);
    bootstrap.onAuthEvent(newSession);
    bootstrap.onBootstrapSession(oldSession);
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith(newSession);
  });

  it("quitte l'écran de chargement en cas de panne initiale", () => {
    const apply = vi.fn();
    createSessionBootstrap(apply).onBootstrapFailure();
    expect(apply).toHaveBeenCalledWith(null);
  });

  it("ne déconnecte pas une session active après une panne de bootstrap", () => {
    const apply = vi.fn();
    const bootstrap = createSessionBootstrap(apply);
    bootstrap.onAuthEvent(newSession);
    bootstrap.onBootstrapFailure();
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith(newSession);
  });

  it("ignore les événements et résultats reçus après démontage", () => {
    const apply = vi.fn();
    const bootstrap = createSessionBootstrap(apply);
    bootstrap.stop();
    bootstrap.onBootstrapSession(oldSession);
    bootstrap.onAuthEvent(newSession);
    bootstrap.onBootstrapFailure();
    expect(apply).not.toHaveBeenCalled();
  });
});
