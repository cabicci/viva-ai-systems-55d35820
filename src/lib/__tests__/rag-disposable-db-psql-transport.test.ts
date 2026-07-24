import { describe, expect, it, vi } from "vitest";
import {
  buildPsqlDockerArgs,
  buildSupabaseDbResetArgs,
  buildSupabaseStartArgs,
  buildSupabaseStatusArgs,
  buildSupabaseStopArgs,
  bunBin,
  dockerBin,
  executePsqlSql,
  PsqlTransportError,
  resetLocalDatabase,
  runSupabaseViaBun,
  startLocalSupabase,
  statusLocalSupabase,
  stopLocalSupabase,
  type ProcessSpawnFn,
  type PsqlSpawnFn,
} from "../../../scripts/rag/lib/disposable-db";

describe("RAG disposable-db psql stdin transport", () => {
  const container = "supabase_db_test_container";
  const eDocker = "E:\\Docker\\Desktop\\resources\\bin\\docker.exe";

  it("builds docker argv with exec -i, psql user/db, ON_ERROR_STOP, and -f -", () => {
    const args = buildPsqlDockerArgs(container);
    expect(args).toEqual([
      "exec",
      "-i",
      container,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-t",
      "-A",
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      "-",
    ]);
    expect(args.join(" ")).not.toContain("-c");
  });

  it("supplies Docker executable as the process program (E: path with backslashes)", () => {
    const spawnFn = vi.fn<PsqlSpawnFn>((_program, _args, options) => {
      expect(options.input).toBe("SELECT 1;");
      return { status: 0, signal: null, stdout: "1\n", stderr: "" };
    });

    executePsqlSql("SELECT 1;", {
      container,
      dockerProgram: eDocker,
      spawnFn,
    });

    expect(spawnFn).toHaveBeenCalledTimes(1);
    const [program, args] = spawnFn.mock.calls[0]!;
    expect(program).toBe(eDocker);
    expect(Array.isArray(args)).toBe(true);
    expect([...args]).toEqual(buildPsqlDockerArgs(container));
  });

  it("passes multiline SQL byte-for-byte on stdin (quotes, semicolons, newlines, dollar-quotes)", () => {
    const sql = `INSERT INTO t (a, b)
      VALUES ('O''Brien', $$line1
line2; still dollar$$);
SELECT 1;`;
    let capturedInput = "";
    const spawnFn: PsqlSpawnFn = (_program, _args, options) => {
      capturedInput = options.input;
      return { status: 0, signal: null, stdout: "ok\n", stderr: "" };
    };

    executePsqlSql(sql, { container, dockerProgram: eDocker, spawnFn });
    expect(capturedInput).toBe(sql);
    expect(capturedInput).toContain("\n");
    expect(capturedInput).toContain("O''Brien");
    expect(capturedInput).toContain("$$line1\nline2; still dollar$$");
  });

  it("does not embed SQL in a shell command string and does not enable shell interpolation", () => {
    const sql = `SELECT 'dangerous'; DROP TABLE x; --'`;
    const spawnFn = vi.fn<PsqlSpawnFn>((program, args, options) => {
      const joined = `${program} ${args.join(" ")}`;
      expect(joined).not.toContain(sql);
      expect(joined).not.toContain("DROP TABLE");
      expect(options.input).toBe(sql);
      return { status: 0, signal: null, stdout: "1\n", stderr: "" };
    });

    executePsqlSql(sql, { container, dockerProgram: eDocker, spawnFn });
    expect(spawnFn).toHaveBeenCalled();
  });

  it("returns stdout on success", () => {
    const out = executePsqlSql("SELECT 42;", {
      container,
      dockerProgram: eDocker,
      spawnFn: () => ({ status: 0, signal: null, stdout: "42\n", stderr: "" }),
    });
    expect(out).toBe("42");
  });

  it("fails on nonzero psql status and retains PostgreSQL stderr", () => {
    expect(() =>
      executePsqlSql("SELECT bad;", {
        container,
        dockerProgram: eDocker,
        spawnFn: () => ({
          status: 3,
          signal: null,
          stdout: "",
          stderr: 'ERROR:  syntax error at or near "bad"\n',
        }),
      }),
    ).toThrow(PsqlTransportError);

    try {
      executePsqlSql("SELECT bad;", {
        container,
        dockerProgram: eDocker,
        spawnFn: () => ({
          status: 3,
          signal: null,
          stdout: "partial",
          stderr: 'ERROR:  syntax error at or near "bad"\n',
        }),
      });
    } catch (e) {
      const err = e as PsqlTransportError;
      expect(err.stderr).toContain("syntax error");
      expect(err.status).toBe(3);
      expect(err.stdout).toBe("partial");
    }
  });

  it("retains process-spawn errors", () => {
    const spawnError = new Error("ENOENT");
    expect(() =>
      executePsqlSql("SELECT 1;", {
        container,
        dockerProgram: eDocker,
        spawnFn: () => ({
          status: null,
          signal: null,
          error: spawnError,
          stdout: "",
          stderr: "",
        }),
      }),
    ).toThrow(/spawn failed/);

    try {
      executePsqlSql("SELECT 1;", {
        container,
        dockerProgram: eDocker,
        spawnFn: () => ({
          status: null,
          signal: null,
          error: spawnError,
          stdout: "",
          stderr: "",
        }),
      });
    } catch (e) {
      expect((e as PsqlTransportError).spawnError).toBe(spawnError);
    }
  });

  it("handles signal termination clearly", () => {
    expect(() =>
      executePsqlSql("SELECT 1;", {
        container,
        dockerProgram: eDocker,
        spawnFn: () => ({
          status: null,
          signal: "SIGTERM",
          stdout: "",
          stderr: "",
        }),
      }),
    ).toThrow(/signal: SIGTERM/);
  });

  it("process.env.DOCKER_BIN overrides the fallback executable via dockerBin()", () => {
    const previous = process.env.DOCKER_BIN;
    try {
      process.env.DOCKER_BIN = eDocker;
      expect(dockerBin()).toBe(eDocker);
      process.env.DOCKER_BIN = "E:\\other\\docker.exe";
      expect(dockerBin()).toBe("E:\\other\\docker.exe");
    } finally {
      if (previous === undefined) delete process.env.DOCKER_BIN;
      else process.env.DOCKER_BIN = previous;
    }
  });
});

describe("RAG disposable-db native Bun Supabase lifecycle launcher", () => {
  const nativeBun = "E:\\DevTools\\Bun\\bin\\bun.exe";

  it("uses non-empty BUN_BIN override as the exact process program", () => {
    const previous = process.env.BUN_BIN;
    try {
      process.env.BUN_BIN = nativeBun;
      expect(bunBin()).toBe(nativeBun);
    } finally {
      if (previous === undefined) delete process.env.BUN_BIN;
      else process.env.BUN_BIN = previous;
    }
  });

  it("defaults to bun.exe on Windows and bun elsewhere", () => {
    const previous = process.env.BUN_BIN;
    try {
      delete process.env.BUN_BIN;
      if (process.platform === "win32") {
        expect(bunBin()).toBe("bun.exe");
      } else {
        expect(bunBin()).toBe("bun");
      }
    } finally {
      if (previous === undefined) delete process.env.BUN_BIN;
      else process.env.BUN_BIN = previous;
    }
  });

  it("never uses npx.cmd and does not use Node process.execPath as the launcher", () => {
    const previous = process.env.BUN_BIN;
    try {
      delete process.env.BUN_BIN;
      expect(bunBin().toLowerCase()).not.toContain("npx");
      expect(bunBin().toLowerCase()).not.toContain("node");
      if (process.execPath.toLowerCase().includes("node")) {
        expect(bunBin()).not.toBe(process.execPath);
      }
    } finally {
      if (previous === undefined) delete process.env.BUN_BIN;
      else process.env.BUN_BIN = previous;
    }
  });

  it("builds Bun argv for start excluding logflare, vector service, and studio only", () => {
    const args = buildSupabaseStartArgs();
    expect(args).toEqual(["x", "supabase", "start", "-x", "logflare,vector,studio"]);
    expect(args[0]).toBe("x");
    expect(args[1]).toBe("supabase");
    expect(args[2]).toBe("start");
    expect(args[3]).toBe("-x");
    expect(args[4]).toBe("logflare,vector,studio");
    expect(args.filter((a) => a === "x")).toHaveLength(1);
    expect(args.filter((a) => a === "-x")).toHaveLength(1);
    const joined = args.join(" ");
    expect(joined.toLowerCase()).not.toContain("postgres");
    expect(joined.toLowerCase()).not.toContain("pgvector");
    expect(joined).not.toContain("--ignore-health-check");
    expect(joined).not.toContain("--linked");
    expect(joined).not.toContain("--project-ref");
    expect(joined).not.toContain("tcp://localhost:2375");
  });

  it("builds Bun argv for status, stop, and db reset", () => {
    expect(buildSupabaseStatusArgs()).toEqual(["x", "supabase", "status"]);
    expect(buildSupabaseStopArgs()).toEqual(["x", "supabase", "stop", "--no-backup"]);
    expect(buildSupabaseDbResetArgs()).toEqual(["x", "supabase", "db", "reset", "--yes"]);
  });

  it("start/status/stop/reset all spawn native Bun with shell:false and structured argv", () => {
    const calls: Array<{ program: string; args: string[]; shell: false }> = [];
    const spawnFn: ProcessSpawnFn = (program, args, options) => {
      expect(options.shell).toBe(false);
      calls.push({ program, args: [...args], shell: options.shell });
      return { status: 0, signal: null, stdout: "ok\n", stderr: "" };
    };

    expect(startLocalSupabase({ spawnFn, bunProgram: nativeBun }).ok).toBe(true);
    expect(statusLocalSupabase({ spawnFn, bunProgram: nativeBun }).ok).toBe(true);
    expect(stopLocalSupabase({ spawnFn, bunProgram: nativeBun }).ok).toBe(true);
    expect(resetLocalDatabase({ spawnFn, bunProgram: nativeBun }).ok).toBe(true);

    expect(calls).toHaveLength(4);
    for (const call of calls) {
      expect(call.program).toBe(nativeBun);
      expect(call.program.toLowerCase()).not.toContain("npx");
      expect(call.shell).toBe(false);
      expect(call.args[0]).toBe("x");
      expect(call.args[1]).toBe("supabase");
      expect(call.args.join(" ")).not.toContain("--ignore-health-check");
      expect(call.args.join(" ")).not.toContain("--linked");
      expect(call.args.join(" ")).not.toContain("--project-ref");
      expect(call.args.join(" ")).not.toContain("tcp://localhost:2375");
    }
    expect(calls[0]!.args).toEqual(buildSupabaseStartArgs());
    expect(calls[1]!.args).toEqual(buildSupabaseStatusArgs());
    expect(calls[2]!.args).toEqual(buildSupabaseStopArgs());
    expect(calls[3]!.args).toEqual(buildSupabaseDbResetArgs());
  });

  it("exposes stdout/stderr and fails on nonzero status, signal, and spawn error", () => {
    const failStatus = runSupabaseViaBun(buildSupabaseStartArgs(), {
      bunProgram: nativeBun,
      spawnFn: () => ({
        status: 1,
        signal: null,
        stdout: "partial-out\n",
        stderr: "boom-err\n",
      }),
    });
    expect(failStatus.ok).toBe(false);
    expect(failStatus.stdout).toContain("partial-out");
    expect(failStatus.stderr).toContain("boom-err");
    expect(failStatus.status).toBe(1);

    const failSignal = startLocalSupabase({
      bunProgram: nativeBun,
      spawnFn: () => ({ status: null, signal: "SIGTERM", stdout: "", stderr: "" }),
    });
    expect(failSignal.ok).toBe(false);
    expect(failSignal.output).toContain("SIGTERM");

    const failSpawn = startLocalSupabase({
      bunProgram: nativeBun,
      spawnFn: () => ({
        status: null,
        signal: null,
        error: new Error("ENOENT"),
        stdout: "",
        stderr: "",
      }),
    });
    expect(failSpawn.ok).toBe(false);
    expect(failSpawn.output).toContain("spawn failed");
  });

  it("preserves SQL stdin transport contract alongside Bun lifecycle launcher", () => {
    const args = buildPsqlDockerArgs("supabase_db_x");
    expect(args).toContain("-f");
    expect(args).toContain("-");
    expect(args).not.toContain("-c");
    const out = executePsqlSql("SELECT 1;", {
      container: "supabase_db_x",
      dockerProgram: "E:\\Docker\\Desktop\\resources\\bin\\docker.exe",
      spawnFn: () => ({ status: 0, signal: null, stdout: "1\n", stderr: "" }),
    });
    expect(out).toBe("1");
  });
});
