import path from "node:path";
import fs from "node:fs";

const configPath = path.join(import.meta.dirname, "../config.json");

interface StatusConfig {
  actions: string[];
  suffixes: string[];
  users: string[];
  interval: number;
}

interface Config {
  links: string[];
  status: StatusConfig;
  [key: string]: unknown;
}

export function getConfig(): Config {
  const data = fs.readFileSync(configPath, "utf8");
  return JSON.parse(data);
}

export function setConfig<K extends keyof Config>(key: K, value: Config[K]): void {
  const config = getConfig();
  config[key] = value;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
