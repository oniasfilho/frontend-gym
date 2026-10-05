import { exercises, type Exercise } from '@/lib/exercises'

export function exercisesForPath(slug: string): Exercise[] {
  if (slug === 'mixed') return exercises
  const focus = {
    'for-of': 'for...of',
    flatmap: 'flatMap',
    sort: 'sort',
    'spread-rest': 'spread',
    set: 'Set',
    'map-collection': 'Map',
    'object-entries': 'Object.entries',
    'object-from-entries': 'Object.fromEntries',
    'optional-chaining': '?.',
    'nullish-coalescing': '??',
  }[slug] ?? slug
  return exercises.filter((exercise) => exercise.tags[0] === focus)
}

export type PathStatus = 'completed' | 'in-progress' | 'available' | 'not-started'

export type ConceptPath = {
  slug: string
  name: string
  description: string
  total: number
  completed: number
  status: PathStatus
}

const definitions: Array<[string, string, string, number]> = [
  ['for-of', 'for...of', 'Fundamental explicit iteration.', 6],
  ['map', 'map', 'Transform every item in an array.', 10],
  ['filter', 'filter', 'Select items matching a condition.', 10],
  ['find', 'find', 'Return the first matching item.', 6],
  ['some', 'some', 'Check whether any item matches.', 5],
  ['every', 'every', 'Check whether all items match.', 5],
  ['reduce', 'reduce', 'Accumulate values into another structure.', 8],
  ['flatmap', 'flatMap', 'Transform and flatten results.', 6],
  ['sort', 'sort / toSorted', 'Order collections without surprises.', 6],
  ['destructuring', 'destructuring', 'Extract values from structures.', 6],
  ['spread-rest', 'spread / rest', 'Copy, combine, and collect values.', 6],
  ['set', 'Set', 'Work with unique-value collections.', 6],
  ['map-collection', 'Map', 'Work with key/value collections.', 6],
  ['object-entries', 'Object.entries', 'Convert objects into iterable entries.', 6],
  ['object-from-entries', 'Object.fromEntries', 'Build objects from entry pairs.', 6],
  ['optional-chaining', 'optional chaining', 'Safely access nullable structures.', 5],
  ['nullish-coalescing', 'nullish coalescing', 'Fallback only for nullish values.', 5],
  ['mixed', 'Mixed Practice', 'Choose and combine previously learned concepts.', 20],
]

export const conceptPaths: ConceptPath[] = definitions.map(([slug, name, description]) => ({
  slug,
  name,
  description,
  total: exercisesForPath(slug).length,
  completed: 0,
  status: exercisesForPath(slug).length ? 'available' : 'not-started',
}))

export const curriculumOrder = conceptPaths.map((path) => path.name)

export function prerequisitesFor(path: ConceptPath) {
  const index = conceptPaths.findIndex((item) => item.slug === path.slug)
  return conceptPaths.slice(0, Math.max(0, index)).map((item) => item.name)
}
