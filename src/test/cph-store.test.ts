import { describe, expect, it } from "vitest";
import { closeCampaign, confirmAttendance, deactivateInterest, isFinished, loadCph, registerInterest, setAttendance } from "@/lib/cph-store";

describe("CPH campaigns", () => {
  it("closing a campaign moves it to the history", () => {
    const s = closeCampaign(loadCph(), "cph-1");
    expect(isFinished(s.campaigns.find(c => c.id === "cph-1")!)).toBe(true);
  });
  it("a closed campaign rejects new confirmations", () => {
    const s = confirmAttendance(closeCampaign(loadCph(), "cph-3"), "cph-3");
    expect(s.campaigns.find(c => c.id === "cph-3")!.participants.some(p => p.id === "demo-user")).toBe(false);
  });
  it("a donor who attended cannot be marked ASISTIO in another campaign", () => {
    const s1 = setAttendance(loadCph(), "cph-1", "i4", "ASISTIO");
    const s2 = setAttendance({ ...s1, campaigns: s1.campaigns.map(c => c.id === "cph-3" ? { ...c, participants: [...c.participants, { id: "i4", name: "C", status: "CONFIRMADO", attendance: null }] } : c) }, "cph-3", "i4", "ASISTIO");
    expect(s2.campaigns.find(c => c.id === "cph-3")!.participants.find(p => p.id === "i4")!.attendance).toBe(null);
  });
  it("deactivating interest removes the donor from the hospital demand", () => {
    const s = deactivateInterest(registerInterest(loadCph(), "Hospital Nacional Dos de Mayo"));
    expect(s.myInterest).toBe(false);
    expect(s.interests.some(i => i.id === "demo-user")).toBe(false);
  });
  it("attendance cannot be marked in a finished campaign", () => {
    const s = setAttendance(closeCampaign(loadCph(), "cph-1"), "cph-1", "p1", "ASISTIO");
    expect(s.campaigns.find(c => c.id === "cph-1")!.participants.find(p => p.id === "p1")!.attendance).toBe(null);
  });
  it("attendance can be marked in an active campaign", () => {
    const s = setAttendance(loadCph(), "cph-1", "p1", "ASISTIO");
    expect(s.campaigns.find(c => c.id === "cph-1")!.participants.find(p => p.id === "p1")!.attendance).toBe("ASISTIO");
  });
});
