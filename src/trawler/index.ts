import type { TrawlResult, TrawlOptions } from '../core/types.js';
import { searchRegistry, searchGithub, searchNpm, searchWellKnown } from './strategies.js';
import { deduplicateResults, rankResults } from './ranker.js';

export async function trawl(
  query: string,
  options: TrawlOptions = {},
): Promise<TrawlResult[]> {
  const sources = options.sources ?? ['registry', 'github'];
  const maxResults = options.maxResults ?? 10;

  // Fan out searches in parallel
  const searches: Promise<TrawlResult[]>[] = [];

  if (sources.includes('registry')) {
    searches.push(searchRegistry(query));
  }
  if (sources.includes('github')) {
    searches.push(searchGithub(query));
  }
  if (sources.includes('npm')) {
    searches.push(searchNpm(query));
  }

  // .well-known/skills/ decentralized discovery
  if (options.domains?.length) {
    searches.push(searchWellKnown(options.domains));
  }

  const allResults = (await Promise.all(searches)).flat();

  // Deduplicate and rank
  const deduplicated = deduplicateResults(allResults);
  const ranked = rankResults(deduplicated, query);

  return ranked.slice(0, maxResults);
}
