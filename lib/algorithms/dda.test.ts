import { describe, it, expect } from "vitest";
import {
  calculateSkillScore,
  calculateTeamSkillScore,
  calculateDifficultyAdjustment,
  adjustDefenseWave,
  type PlayerProfile,
  type TeamProfile,
} from "./dda";

const elitePlayer: PlayerProfile = {
  historicalWinRate: 0.85,
  averageDps: 280,
  accuracy: 0.92,
  averageDeathsPerRun: 0.8,
  totalRuns: 120,
};

const newPlayer: PlayerProfile = {
  historicalWinRate: 0.25,
  averageDps: 60,
  accuracy: 0.45,
  averageDeathsPerRun: 4.5,
  totalRuns: 5,
};

const averagePlayer: PlayerProfile = {
  historicalWinRate: 0.55,
  averageDps: 130,
  accuracy: 0.7,
  averageDeathsPerRun: 2,
  totalRuns: 40,
};

describe("DDA 动态难度", () => {
  it("精英玩家技能分高于新手", () => {
    expect(calculateSkillScore(elitePlayer)).toBeGreaterThan(
      calculateSkillScore(newPlayer)
    );
  });

  it("混合队伍技能分会因配合度折减", () => {
    const mixed: TeamProfile = { players: [elitePlayer, newPlayer] };
    const avg =
      (calculateSkillScore(elitePlayer) + calculateSkillScore(newPlayer)) / 2;
    expect(calculateTeamSkillScore(mixed)).toBeLessThan(avg);
  });

  it("精英队伍获得正向难度调整，新手队伍获得负向调整", () => {
    const eliteTeam: TeamProfile = { players: [elitePlayer, elitePlayer] };
    const newTeam: TeamProfile = { players: [newPlayer, newPlayer] };
    expect(calculateDifficultyAdjustment(eliteTeam)).toBeGreaterThan(0);
    expect(calculateDifficultyAdjustment(newTeam)).toBeLessThan(0);
  });

  it("失败波次会降低下一波难度", () => {
    const team: TeamProfile = { players: [averagePlayer] };
    const noResult = calculateDifficultyAdjustment(team);
    const failed = calculateDifficultyAdjustment(team, {
      cleared: false,
      coreHealthPercent: 0.1,
    });
    expect(failed).toBeLessThan(noResult);
  });

  it("调整参数始终在安全区间内", () => {
    const team: TeamProfile = { players: [elitePlayer, elitePlayer, elitePlayer] };
    const wave = { index: 3, enemyCount: 24, eliteCount: 4 };
    const adjusted = adjustDefenseWave(wave, team);

    expect(adjusted.enemyCountMultiplier).toBeGreaterThanOrEqual(0.65);
    expect(adjusted.enemyCountMultiplier).toBeLessThanOrEqual(1.45);
    expect(adjusted.enemyHealthMultiplier).toBeGreaterThanOrEqual(0.75);
    expect(adjusted.enemyHealthMultiplier).toBeLessThanOrEqual(1.35);
    expect(adjusted.eliteRatio).toBeGreaterThanOrEqual(0);
    expect(adjusted.eliteRatio).toBeLessThanOrEqual(0.55);
  });

  it("精英队伍波次更难", () => {
    const base = { index: 2, enemyCount: 20, eliteCount: 2 };
    const eliteAdjusted = adjustDefenseWave(base, { players: [elitePlayer] });
    const newAdjusted = adjustDefenseWave(base, { players: [newPlayer] });

    expect(eliteAdjusted.enemyCountMultiplier).toBeGreaterThan(
      newAdjusted.enemyCountMultiplier
    );
    expect(eliteAdjusted.enemyDamageMultiplier).toBeGreaterThan(
      newAdjusted.enemyDamageMultiplier
    );
  });
});
