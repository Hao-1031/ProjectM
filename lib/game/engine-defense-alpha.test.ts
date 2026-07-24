import { describe, it, expect, vi } from "vitest";
import { GameEngine } from "./engine";

describe("engine alpha integration", () => {
  it("initializes alpha scheduler in defense mode", () => {
    const engine = new GameEngine({}, "defense", 12345, {
      heroId: "recon",
      weaponIds: ["pulse"],
    });
    // @ts-expect-error private access for test
    expect(engine.alphaScheduler).toBeDefined();
    // @ts-expect-error private access for test
    expect(engine.alphaPlanRef).toBeDefined();
    // @ts-expect-error private access for test
    expect(engine.alphaPlanRef.enemyStats.waveEnemyCount).toBeGreaterThan(0);
  });

  it("generates increasing wave difficulty across all waves", () => {
    const engine = new GameEngine({}, "defense", 42, { heroId: "nitrogen" });
    // @ts-expect-error private access for test
    const scheduler = engine.alphaScheduler;
    expect(scheduler).toBeDefined();

    const plans = scheduler!.generateAllPlans();
    expect(plans.length).toBe(8);

    const difficulties = plans.map((p) => p.snapshot.finalDifficulty);
    // 最终波难度应高于初始波
    expect(difficulties[difficulties.length - 1]).toBeGreaterThan(difficulties[0]);

    // 难度曲线总体单调不减（允许 Boss 波呼吸造成小幅下降）
    let drops = 0;
    for (let i = 1; i < difficulties.length; i++) {
      if (difficulties[i] < difficulties[i - 1] - 0.05) drops++;
    }
    expect(drops).toBeLessThanOrEqual(2);
  });

  it("marks boss wave in the final wave plan", () => {
    const engine = new GameEngine({}, "defense", 7, { heroId: "leopard" });
    // @ts-expect-error private access for test
    const scheduler = engine.alphaScheduler;
    const plans = scheduler!.generateAllPlans();
    const bossWaves = plans.filter((p) => p.isBossWave);
    expect(bossWaves.length).toBeGreaterThan(0);
    expect(bossWaves[bossWaves.length - 1]?.waveIndex).toBe(7);
  });

  it("applies alpha stats to spawned enemies in defense mode", () => {
    const engine = new GameEngine({}, "defense", 99, { heroId: "bastion" });
    engine.start();

    // @ts-expect-error private access for test
    const alphaPlan = engine.alphaPlanRef;
    expect(alphaPlan).toBeDefined();

    // 直接调用 spawnEnemy 并传入 α 计划，验证数值覆盖
    // @ts-expect-error private access for test
    engine.spawnEnemy("walker", false, alphaPlan.enemyStats);
    expect(engine.state.enemies.length).toBe(1);

    const enemy = engine.state.enemies[0];
    expect(enemy.variant).toBe("walker");
    expect(enemy.maxHealth).toBeGreaterThan(100);
    expect(enemy.damage).toBeGreaterThan(0);
    expect(enemy.speed).toBeGreaterThan(0);

    // 记录已 spawn 计数
    expect(alphaPlan!.spawned).toBe(1);
  });

  it("records telemetry events during combat", () => {
    const engine = new GameEngine({}, "defense", 2024, { heroId: "viper" });
    engine.start();

    const ds = engine.state.defenseState!;
    ds.breakTimer = 0;
    ds.currentWave = 0;

    // 手动生成一个敌人并击杀以验证 telemetry
    // @ts-expect-error private access for test
    engine.spawnEnemy("walker", false, engine.alphaPlanRef?.enemyStats);
    const enemy = engine.state.enemies[0];
    enemy.health = 0;

    // @ts-expect-error private access for test
    engine.cleanDeadEnemies();

    // @ts-expect-error private access for test
    const telemetry = engine.alphaScheduler!.telemetry;
    const window = telemetry.getWindow();
    expect(window.spawned).toBe(1);
    expect(window.killed).toBe(1);
  });

  it("advances wave and refreshes alpha plan", () => {
    const engine = new GameEngine({}, "defense", 55, { heroId: "falcon" });
    engine.start();

    const ds = engine.state.defenseState!;
    const scheduler = engine["alphaScheduler"];
    expect(scheduler).toBeDefined();

    // 模拟第 0 波结束
    ds.waveInProgress = false;
    ds.breakTimer = 0;
    ds.currentWave = 0;

    const input = { move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, fire: false, pause: false };
    engine.update(input, performance.now() + 16);

    // @ts-expect-error private access for test
    expect(engine.alphaPlanRef?.snapshot.waveIndex).toBe(1);
  });
});
