import { BlockedWord } from "../models";

let cache: Set<string> | null = null;
let cacheExpiresAt = 0;

async function getWordList(): Promise<Set<string>> {
  if (cache && Date.now() < cacheExpiresAt) return cache;
  const words = await BlockedWord.find().select("word").lean();
  cache = new Set(words.map((w) => w.word.toLowerCase()));
  cacheExpiresAt = Date.now() + 60_000;
  return cache;
}

export function invalidateProfanityCache(): void {
  cache = null;
}

export async function containsProfanity(text: string): Promise<boolean> {
  const words = await getWordList();
  if (words.size === 0) return false;
  const tokens = text.toLowerCase().split(/[^a-z0-9']+/g);
  return tokens.some((t) => words.has(t));
}

export async function censorText(text: string): Promise<string> {
  const words = await getWordList();
  if (words.size === 0) return text;
  return text.replace(/[a-zA-Z0-9']+/g, (token) => (words.has(token.toLowerCase()) ? "*".repeat(token.length) : token));
}
