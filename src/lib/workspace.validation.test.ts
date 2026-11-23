import { describe, expect, it } from "vitest";
import { validateSelectedRules } from "./workspace.server";
import type { DeductionRule } from "./pricing";

const rule: DeductionRule = {
  id: "rule-a",
  name: "Écran rayé",
  category: "esthetique",
  deduction: 20,
  is_blocking: false,
  active: true,
  sort_order: 0,
};

describe("validation des critères d'estimation", () => {
  it("accepte les critères actifs réellement retournés", () => {
    expect(validateSelectedRules(["rule-a"], [rule])).toEqual([rule]);
  });

  it("accepte une estimation sans critère sélectionné", () => {
    expect(validateSelectedRules([], [])).toEqual([]);
  });

  it("refuse les critères inconnus ou non visibles dans la boutique", () => {
    expect(() => validateSelectedRules(["rule-a", "missing-rule"], [rule])).toThrow(
      "Critères de déduction indisponibles",
    );
  });

  it("refuse un critère sélectionné deux fois", () => {
    expect(() => validateSelectedRules(["rule-a", "rule-a"], [rule])).toThrow(
      "Critères de déduction indisponibles",
    );
  });

  it("refuse un critère inactif même s'il est retourné", () => {
    expect(() => validateSelectedRules(["rule-a"], [{ ...rule, active: false }])).toThrow(
      "Critères de déduction indisponibles",
    );
  });

  it("refuse une réponse de données avec des critères en double", () => {
    expect(() => validateSelectedRules(["rule-a"], [rule, rule])).toThrow(
      "Critères de déduction indisponibles",
    );
  });
});
