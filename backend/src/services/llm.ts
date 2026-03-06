import { ChatOpenAI } from '@langchain/openai'

export function createDeepSeekLLM() {
  // DeepSeek API is OpenAI-compatible
  return new ChatOpenAI({
    modelName: 'deepseek-chat',
    apiKey: process.env.DEEPSEEK_API_KEY,
    configuration: {
      baseURL: 'https://api.deepseek.com/v1',
    },
    temperature: 0.7,
  })
}

export function createCloneLLM() {
  // Same as above, but with higher temperature for variety
  return new ChatOpenAI({
    modelName: 'deepseek-chat',
    apiKey: process.env.DEEPSEEK_API_KEY,
    configuration: {
      baseURL: 'https://api.deepseek.com/v1',
    },
    temperature: 0.8,
  })
}
