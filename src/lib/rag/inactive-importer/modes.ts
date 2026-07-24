import { FORBIDDEN_MODES, type ImporterOperation } from "./constants";

export class ModeError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ModeError";
    this.code = code;
  }
}

export function parseOperation(raw: string | undefined): ImporterOperation {
  const value = (raw ?? "preflight").trim().toLowerCase();
  if ((FORBIDDEN_MODES as readonly string[]).includes(value)) {
    throw new ModeError(
      "FORBIDDEN_MODE",
      `Mode '${value}' is forbidden. Activation/rollback/delete/seed-100/replace are not part of the inactive importer.`,
    );
  }
  if (value === "preflight" || value === "import" || value === "validate") {
    return value;
  }
  throw new ModeError("UNKNOWN_MODE", `Unknown operation '${value}'`);
}

export function assertActivationUnavailable(argv: string[]): void {
  const joined = argv.map((a) => a.toLowerCase());
  for (const mode of FORBIDDEN_MODES) {
    if (joined.includes(mode) || joined.includes(`--${mode}`)) {
      throw new ModeError(
        "FORBIDDEN_MODE",
        `Activation and destructive modes are unavailable (saw '${mode}').`,
      );
    }
  }
}
