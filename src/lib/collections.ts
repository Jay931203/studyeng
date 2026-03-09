/**
 * Runtime data layer for Shortee collections.
 *
 * Reads the pre-built collections-manifest.json at import time
 * and provides accessor functions for the app.
 * Individual collection details are lazy-loaded on demand.
 */

import type { CollectionGroup } from '@/data/collection-templates'

// --- Types ---

export interface CollectionSummary {
  id: string
  name: string
  description: string
  group: string
  sentenceCount: number
  videoCount: number
}

export interface CollectionVideoMatch {
  videoId: string
  title: string
  category: string
  matchedSentences: number[]
}

export interface CollectionManifestEntry extends CollectionSummary {
  videos: CollectionVideoMatch[]
}

export interface CollectionSentence {
  videoId: string
  sentenceIdx: number
  en: string
  ko: string
  tags: Record<string, unknown>
}

export interface CollectionDetail {
  id: string
  name: string
  description: string
  group: string
  sentences: CollectionSentence[]
}

interface CollectionsManifest {
  generatedAt: string
  totalTaggedSentences: number
  totalCollections: number
  collections: CollectionManifestEntry[]
}

// --- Manifest Loading ---

let manifest: CollectionsManifest | null = null

function loadManifest(): CollectionsManifest {
  if (manifest) return manifest

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    manifest = require('../../public/collections-manifest.json') as CollectionsManifest
    return manifest
  } catch {
    // Manifest doesn't exist yet (build hasn't run)
    manifest = {
      generatedAt: '',
      totalTaggedSentences: 0,
      totalCollections: 0,
      collections: [],
    }
    return manifest
  }
}

// --- Group Labels ---

const groupLabels: Record<CollectionGroup, string> = {
  situation: '상황별 영어',
  vibe: '분위기별 영어',
  function: '기능별 영어',
  level: '레벨별 영어',
  grammar: '문법별 영어',
  theme: '테마별 영어',
}

const groupOrder: CollectionGroup[] = [
  'situation',
  'vibe',
  'function',
  'level',
  'grammar',
  'theme',
]

// --- Public API ---

/**
 * Get all collections as summaries (without video/sentence detail).
 */
export function getAllCollections(): CollectionSummary[] {
  const { collections } = loadManifest()
  return collections.map(({ id, name, description, group, sentenceCount, videoCount }) => ({
    id,
    name,
    description,
    group,
    sentenceCount,
    videoCount,
  }))
}

/**
 * Get collections filtered by group.
 */
export function getCollectionsByGroup(group: string): CollectionSummary[] {
  return getAllCollections().filter((c) => c.group === group)
}

/**
 * Get the ordered list of collection groups with Korean labels.
 */
export function getCollectionGroups(): { id: string; label: string }[] {
  return groupOrder.map((id) => ({ id, label: groupLabels[id] }))
}

/**
 * Get a specific collection summary by ID.
 */
export function getCollectionById(collectionId: string): CollectionSummary | undefined {
  return getAllCollections().find((c) => c.id === collectionId)
}

/**
 * Get the manifest entry for a collection (includes video matches).
 */
export function getCollectionManifestEntry(
  collectionId: string,
): CollectionManifestEntry | undefined {
  const { collections } = loadManifest()
  return collections.find((c) => c.id === collectionId)
}

/**
 * Lazy-load the full collection detail (all matched sentences).
 * Fetches from /collections/{collectionId}.json at runtime.
 */
export async function getCollectionDetail(
  collectionId: string,
): Promise<CollectionDetail | null> {
  try {
    const response = await fetch(`/collections/${collectionId}.json`)
    if (!response.ok) return null
    return (await response.json()) as CollectionDetail
  } catch {
    return null
  }
}

/**
 * Get total stats from the manifest.
 */
export function getCollectionStats(): {
  totalTaggedSentences: number
  totalCollections: number
  generatedAt: string
} {
  const { totalTaggedSentences, totalCollections, generatedAt } = loadManifest()
  return { totalTaggedSentences, totalCollections, generatedAt }
}
