import { spawn } from "node:child_process";

const processes = [
  ["backend", ["--prefix", "backend", "run", "dev"]],
  ["frontend", ["--prefix", "frontend", "run", "dev"]],
].map(([name, args]) => {
  const child = spawn("npm", args, { stdio: "inherit", env: process.env });
  child.on("exit", (code, signal) => {
    if (code && !signal) console.error(`${name} exited with code ${code}`);
  });
  return child;
});

const shutdown = () => {
  for (const child of processes) child.kill("SIGTERM");
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);