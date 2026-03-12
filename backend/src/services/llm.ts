import { ChatOpenAI } from '@langchain/openai'
import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers'

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

let embeddingPipeline: FeatureExtractionPipeline | null = null

async function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/gte-small') as FeatureExtractionPipeline
  }
  return embeddingPipeline
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const pipe = await getEmbeddingPipeline()
  const results = await pipe(texts, { pooling: 'mean', normalize: true })
  return results.tolist()
}

export async function embedQuery(text: string): Promise<number[]> {
  const vectors = await embedTexts([text])
  return vectors[0]
}
