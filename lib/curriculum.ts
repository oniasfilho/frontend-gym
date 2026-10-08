import { exercises, type Exercise, type PathSlug } from '@/lib/exercises'

export function exercisesForPath(slug: string): Exercise[] {
  return exercises.filter((exercise) => exercise.path === slug)
}

export type PathStatus = 'completed' | 'in-progress' | 'available' | 'not-started'

export type ConceptPath = {
  slug: PathSlug
  name: string
  description: string
  total: number
  completed: number
  status: PathStatus
}

const definitions: Array<[PathSlug, string, string]> = [
  ['for-of', 'for...of', 'Fundamental explicit iteration.'],
  ['map', 'map', 'Transform every item in an array.'],
  ['filter', 'filter', 'Select items matching a condition.'],
  ['find', 'find', 'Return the first matching item.'],
  ['some', 'some', 'Check whether any item matches.'],
  ['every', 'every', 'Check whether all items match.'],
  ['reduce', 'reduce', 'Accumulate values into another structure.'],
  ['flatmap', 'flatMap', 'Transform and flatten results.'],
  ['sort', 'sort / toSorted', 'Order collections without surprises.'],
  ['string-parts', 'split / join', 'Break strings into parts and combine parts into strings.'],
  ['string-normalization', 'string normalization', 'Normalize casing and whitespace into predictable string values.'],
  ['string-matching', 'startsWith / endsWith / includes', 'Recognize prefixes, suffixes, and contained text.'],
  ['array-position', 'findIndex / indexOf / includes', 'Find positions and check whether values exist in arrays.'],
  ['array-extraction', 'slice / reverse', 'Extract ranges from arrays and work with reversed ordering.'],
  ['destructuring', 'destructuring', 'Extract values from structures.'],
  ['spread-rest', 'spread / rest', 'Copy, combine, and collect values.'],
  ['set', 'Set', 'Work with unique-value collections.'],
  ['map-collection', 'Map', 'Work with key/value collections.'],
  ['object-entries', 'Object.entries', 'Convert objects into iterable entries.'],
  ['object-from-entries', 'Object.fromEntries', 'Build objects from entry pairs.'],
  ['optional-chaining', 'optional chaining', 'Safely access nullable structures.'],
  ['nullish-coalescing', 'nullish coalescing', 'Fallback only for nullish values.'],
  ['sliding-window', 'Sliding window', 'Maintain a moving range of values and update its state one edge at a time.'],
  ['mixed', 'Mixed Practice','Choose and combine previously learned concepts.'],
]

export const conceptPaths: ConceptPath[] = definitions.map(([slug, name, description]) => {
  const total = exercisesForPath(slug).length
  return { slug, name, description, total, completed: 0, status: total ? 'available' : 'not-started' }
})

export type Track = { slug: string; name: string; comingSoon?: boolean }

export const tracks: Track[] = [{ slug: 'data-transformation', name: 'Data Transformation' }]

export const curriculumOrder = conceptPaths.map((path) => path.name)

const pathNames = new Map<string, string>(definitions.map(([slug, name]) => [slug, name]))

export function conceptLabel(concept: string) {
  return pathNames.get(concept) ?? concept
}

export function focusOf(exercise: Exercise) {
  return exercise.path === 'mixed' ? 'Mixed Practice' : conceptLabel(exercise.path)
}

export function supportOf(exercise: Exercise) {
  return exercise.concepts.filter((concept) => concept !== exercise.path).map(conceptLabel)
}

export function nextPathAfter(slug: string) {
  const index = conceptPaths.findIndex((path) => path.slug === slug)
  return conceptPaths.slice(index + 1).find((path) => path.total > 0)
}

export function prerequisitesFor(path: ConceptPath) {
  const index = conceptPaths.findIndex((item) => item.slug === path.slug)
  return conceptPaths.slice(0, Math.max(0, index)).map((item) => item.name)
}
