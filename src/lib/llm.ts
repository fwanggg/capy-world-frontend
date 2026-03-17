import { ChatOpenAI } from "@langchain/openai";

/** Seed for deterministic outputs. Set DEEPSEEK_SEED=off to disable; otherwise uses 42. */
function getSeed(): number | undefined {
  const v = process.env.DEEPSEEK_SEED
  if (v === "" || /^(off|false|disable|0)$/i.test(v ?? "")) return undefined
  if (v === undefined) return 42
  const n = parseInt(v, 10)
  return Number.isNaN(n) ? 42 : n
}

const seed = getSeed()
const modelKwargs = seed !== undefined ? { seed } : undefined

export function createDeepSeekLLM() {
  return new ChatOpenAI({
    modelName: "deepseek-chat",
    apiKey: process.env.DEEPSEEK_API_KEY,
    configuration: {
      baseURL: "https://api.deepseek.com/v1",
    },
    temperature: 0.7, // Higher = more imaginative, thinks more broadly
    ...(modelKwargs && { modelKwargs }),
  });
}

export function createCloneLLM() {
  return new ChatOpenAI({
    modelName: "deepseek-chat",
    apiKey: process.env.DEEPSEEK_API_KEY,
    configuration: {
      baseURL: "https://api.deepseek.com/v1",
    },
    temperature: 0.35, // Lower = grounded in persona, less imaginative
    ...(modelKwargs && { modelKwargs }),
  });
}
