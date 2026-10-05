import { forPath, users } from './define'

const set = forPath('set', 'A Set stores each distinct value once, in first-insertion order. Use has for membership. Return a regular array when the result is a collection.')
const map = forPath('map-collection', 'A Map associates keys with values. set adds or replaces an entry; get retrieves it. Return a retrieved value or an array of entries, not a raw Map.')

export const collectionLessons = [
  set('set-unique-numbers', 'Remove duplicate numbers', 'Use a Set to return unique numbers in first-appearance order, as a regular array.', [2, 4, 2, 6, 4], null,
    (input) => [...new Set(input)], 'return [...new Set(input)]', { support: ['spread-rest'] }),
  set('set-unique-strings', 'Remove duplicate strings', 'Use a Set to return unique strings in first-appearance order, as a regular array.', ['Ana', 'Bruno', 'Ana', 'Carla'], null,
    (input) => [...new Set(input)], 'return [...new Set(input)]', { support: ['spread-rest'] }),
  set('set-has-member', 'Check membership', 'Build a Set and use has to return whether the name in extra is present.', ['Ana', 'Bruno', 'Carla'], 'Bruno',
    (input, extra) => new Set(input).has(extra), 'const names = new Set(input)\nreturn names.has(extra)'),
  set('set-unique-categories', 'Unique categories', 'Use a Set to return unique category names in first-appearance order, as an array.', [{ category: 'food' }, { category: 'books' }, { category: 'food' }], null,
    (input) => { const categories = new Set<string>(); for (const item of input) categories.add(item.category); return [...categories] }, 'const categories = new Set<string>()\nfor (const item of input) {\n  categories.add(item.category)\n}\nreturn [...categories]', { support: ['for-of', 'spread-rest'] }),
  set('set-union', 'Union two collections', 'Return every distinct number appearing in either array. Preserve first-appearance order, visiting input before extra.', [1, 2, 3], [3, 4, 2, 5],
    (input, extra) => [...new Set([...input, ...extra])], 'return [...new Set([...input, ...extra])]', { support: ['spread-rest'], difficulty: 'medium' }),
  set('set-intersection', 'Intersection of collections', 'Use Set membership to return unique numbers present in both arrays, keeping their first-appearance order in input.', [1, 2, 2, 3, 4], [2, 4, 5],
    (input, extra) => { const allowed = new Set(extra); return [...new Set(input)].filter((value) => allowed.has(value)) }, 'const allowed = new Set(extra)\nreturn [...new Set(input)].filter((value) => allowed.has(value))', { support: ['spread-rest', 'filter'], difficulty: 'medium' }),

  map('map-collection-pair-lookup', 'Retrieve from simple pairs', 'Build a Map from input pairs and return the value for the key in extra. Each pair is an ordinary [key, value] array.', [['BR', 'Brazil'], ['US', 'United States'], ['PT', 'Portugal']] as [string, string][], 'BR',
    (input, extra) => new Map(input).get(extra), 'const countries = new Map(input)\nreturn countries.get(extra)'),
  map('map-collection-index-users', 'Index users by ID', 'Use a Map keyed by user ID, then return the original user whose ID is in extra.', users, 2,
    (input, extra) => { const byId = new Map<number, (typeof input)[number]>(); for (const user of input) byId.set(user.id, user); return byId.get(extra) }, 'const byId = new Map()\nfor (const user of input) {\n  byId.set(user.id, user)\n}\nreturn byId.get(extra)', { support: ['for-of'] }),
  map('map-collection-update-entry', 'Add or update entries', 'Build a Map from input. Set the key and value provided by extra, then return [...map]. Updating an existing key keeps its position.', [['Ana', 1], ['Bruno', 2], ['Carla', 3]] as [string, number][], { key: 'Bruno', value: 5 },
    (input, extra) => { const scores = new Map(input); scores.set(extra.key, extra.value); return [...scores] }, 'const scores = new Map(input)\nscores.set(extra.key, extra.value)\nreturn [...scores]', { support: ['spread-rest'] }),
  map('map-collection-count-occurrences', 'Count occurrences', 'Use a Map to count each name and return its entries as an array, in first-appearance order.', ['Ana', 'Bruno', 'Ana', 'Carla', 'Bruno'], null,
    (input) => { const counts = new Map<string, number>(); for (const name of input) { const count = counts.get(name); counts.set(name, count === undefined ? 1 : count + 1) } return [...counts] }, 'const counts = new Map<string, number>()\nfor (const name of input) {\n  const count = counts.get(name)\n  counts.set(name, count === undefined ? 1 : count + 1)\n}\nreturn [...counts]', { support: ['for-of', 'spread-rest'], difficulty: 'medium' }),
  map('map-collection-join-records', 'Join through a lookup', 'Index input users in a Map. For each record in extra, return { task, user } with the matching complete user object. Every ID exists.', users, [{ task: 'Review', userId: 3 }, { task: 'Write', userId: 1 }, { task: 'Test', userId: 2 }],
    (input, extra) => { const byId = new Map<number, (typeof input)[number]>(); for (const user of input) byId.set(user.id, user); return extra.map((record) => ({ task: record.task, user: byId.get(record.userId) })) }, 'const byId = new Map()\nfor (const user of input) {\n  byId.set(user.id, user)\n}\nreturn extra.map((record) => ({ task: record.task, user: byId.get(record.userId) }))', { support: ['for-of', 'map'], difficulty: 'medium' }),
  map('map-collection-requested-values', 'Return requested values', 'Build a Map from input pairs. Return the values for the keys in extra, in requested order. Missing keys should produce undefined in that position.', [['BR', 'Brazil'], ['US', 'United States'], ['PT', 'Portugal']] as [string, string][], ['PT', 'BR', 'XX'],
    (input, extra) => { const lookup = new Map(input); return extra.map((key) => lookup.get(key)) }, 'const lookup = new Map(input)\nreturn extra.map((key) => lookup.get(key))', { support: ['map'], difficulty: 'medium' }),
]
