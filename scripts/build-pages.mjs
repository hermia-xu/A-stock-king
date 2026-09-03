import { mkdirSync, renameSync, rmSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const apiDir = path.join(root, "src/app/api");
const stashDir = path.join(root, ".pages-stash/api");

function run(cmd, args, env = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

mkdirSync(path.dirname(stashDir), { recursive: true });
if (existsSync(stashDir)) {
  rmSync(stashDir, { recursive: true, force: true });
}

let moved = false;
if (existsSync(apiDir)) {
  renameSync(apiDir, stashDir);
  moved = true;
}

try {
  run("npx", ["next", "build"], {
    GITHUB_PAGES: "true",
    NEXT_PUBLIC_USE_EM_PROXY: "false",
    NEXT_PUBLIC_BASE_PATH: "/A-stock-king",
  });
} finally {
  if (moved) {
    if (existsSync(apiDir)) {
      rmSync(apiDir, { recursive: true, force: true });
    }
    renameSync(stashDir, apiDir);
  }
}
