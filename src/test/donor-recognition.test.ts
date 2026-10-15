import { describe, expect, it } from "vitest";
import { BLOOD_TYPES, bloodCompatibility, canDonateTo, donorRank } from "@/lib/donor-recognition";

describe("Red-cell compatibility", () => {
  it("O negative donates to every group and only receives O negative", () => {
    expect(bloodCompatibility("O-")).toEqual({ donateTo: [...BLOOD_TYPES], receiveFrom: ["O-"] });
  });
  it("AB positive receives every group and only donates to AB positive", () => {
    expect(bloodCompatibility("AB+")).toEqual({ donateTo: ["AB+"], receiveFrom: [...BLOOD_TYPES] });
  });
  it("respects ABO and Rh restrictions", () => {
    expect(bloodCompatibility("A-")).toEqual({ donateTo: ["A-", "A+", "AB-", "AB+"], receiveFrom: ["O-", "A-"] });
    expect(bloodCompatibility("O+")).toEqual({ donateTo: ["O+", "A+", "B+", "AB+"], receiveFrom: ["O-", "O+"] });
    expect(canDonateTo("B+", "A+")).toBe(false);
    expect(bloodCompatibility("")).toEqual({ donateTo: [], receiveFrom: [] });
  });
});

describe("Donor recognition", () => {
  it.each([[0, "Inicial"], [1, "Bronce"], [2, "Bronce"], [3, "Plata"], [6, "Plata"], [7, "Oro"], [14, "Oro"], [15, "Platino"]])("ranks %i donations as %s", (total, rank) => {
    expect(donorRank(Number(total))).toBe(rank);
  });
});