/**
 * Search indexing queue.
 *
 * Declaration only — no BullMQ connection at import time. Wired to a Worker
 * when ENABLE_QUEUES=true and REDIS_URL is set.
 */
export const SEARCH_INDEX_QUEUE = 'search-index'

export interface SearchIndexJob {
  type: 'course' | 'article'
  id: string
  action: 'index' | 'delete'
}
