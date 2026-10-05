import { forPath, users } from './define'

const entries = forPath('object-entries', 'Object.entries turns an object into an array of [key, value] pairs. Each pair is an ordinary two-element array: pair[0] is the key and pair[1] is the value.')
const fromEntries = forPath('object-from-entries', 'Object.fromEntries turns an array of [key, value] pairs into an object. A pair is an ordinary two-element array, not an object property until it is converted. This reverses Object.entries.')
const countries = { BR: 'Brazil', US: 'United States', PT: 'Portugal' }
const pairs: [string, string][] = [['BR', 'Brazil'], ['US', 'United States'], ['PT', 'Portugal']]

export const entryLessons = [
  entries('entries-country-codes', 'Return country entries', 'Return the entries of the country object. For example, BR becomes ["BR", "Brazil"].', countries, null,
    (input) => Object.entries(input), 'return Object.entries(input)'),
  entries('entries-format-labels', 'Format each entry', 'Return a string for every entry, such as "BR: Brazil", keeping entry order.', countries, null,
    (input) => Object.entries(input).map((pair) => pair[0] + ': ' + pair[1]), 'return Object.entries(input).map((pair) => pair[0] + ": " + pair[1])', { support: ['map'] }),
  entries('entries-positive-stock', 'Keep entries by value', 'Return only [key, value] pairs whose stock value is greater than zero. Do not rebuild an object.', { pens: 3, books: 0, clips: 5 }, null,
    (input) => Object.entries(input).filter((pair) => pair[1] > 0), 'return Object.entries(input).filter((pair) => pair[1] > 0)', { support: ['filter'] }),
  entries('entries-largest-value', 'Find the largest entry', 'Return the [key, value] pair with the largest numeric value. The object is non-empty; keep the first entry on a tie.', { Ana: 80, Bruno: 95, Carla: 90 }, null,
    (input) => { const pairs = Object.entries(input); let largest = pairs[0]; for (const pair of pairs) { if (pair[1] > largest[1]) largest = pair } return largest }, 'const pairs = Object.entries(input)\nlet largest = pairs[0]\nfor (const pair of pairs) {\n  if (pair[1] > largest[1]) largest = pair\n}\nreturn largest', { support: ['for-of'], difficulty: 'medium' }),
  entries('entries-key-value-objects', 'Pairs into named fields', 'Return an array of { key, value } objects, one for each entry, in entry order.', countries, null,
    (input) => Object.entries(input).map((pair) => ({ key: pair[0], value: pair[1] })), 'return Object.entries(input).map((pair) => ({ key: pair[0], value: pair[1] }))', { support: ['map'], difficulty: 'medium' }),
  entries('entries-sort-by-value', 'Sort entry pairs by value', 'Return [key, value] pairs ordered by numeric value ascending. Keep the output as pairs, not an object.', { pens: 3, books: 1, clips: 5 }, null,
    (input) => Object.entries(input).toSorted((a, b) => a[1] - b[1]), 'return Object.entries(input).toSorted((a, b) => a[1] - b[1])', { support: ['sort'], difficulty: 'medium' }),

  fromEntries('from-entries-country-codes', 'Build an object from pairs', 'Convert the country pairs to an object. ["BR", "Brazil"] becomes the BR property with value "Brazil".', pairs, null,
    (input) => Object.fromEntries(input), 'return Object.fromEntries(input)', { inputType: '[string, string][]' }),
  fromEntries('from-entries-record-pairs', 'Record values in pairs', 'Build an object from these [ID, record] pairs. Keep each record unchanged as the property value.', [['u1', { name: 'Ana', active: true }], ['u2', { name: 'Bruno', active: false }], ['u3', { name: 'Carla', active: true }]] as [string, { name: string; active: boolean }][], null,
    (input) => Object.fromEntries(input), 'return Object.fromEntries(input)', { inputType: '[string, { name: string; active: boolean }][]' }),
  fromEntries('from-entries-swap-pairs', 'Swap keys and values', 'Return an object keyed by country name with the country code as its value. All names are unique.', pairs, null,
    (input) => Object.fromEntries(input.map((pair) => [pair[1], pair[0]])), 'return Object.fromEntries(input.map((pair) => [pair[1], pair[0]]))', { support: ['map'], inputType: '[string, string][]' }),
  fromEntries('from-entries-double-values', 'Transform pair values', 'Double each numeric value, then return an object with the original keys.', [['pens', 3], ['books', 1], ['clips', 5]] as [string, number][], null,
    (input) => Object.fromEntries(input.map((pair) => [pair[0], pair[1] * 2])), 'return Object.fromEntries(input.map((pair) => [pair[0], pair[1] * 2]))', { support: ['map'], inputType: '[string, number][]' }),
  fromEntries('from-entries-remove-unwanted', 'Remove unwanted pairs', 'Return an object made only from pairs with values greater than zero.', [['pens', 3], ['books', 0], ['clips', 5]] as [string, number][], null,
    (input) => Object.fromEntries(input.filter((pair) => pair[1] > 0)), 'return Object.fromEntries(input.filter((pair) => pair[1] > 0))', { support: ['filter'], inputType: '[string, number][]', difficulty: 'medium' }),
  fromEntries('from-entries-index-users', 'Index records by ID', 'Return an object keyed by user ID. Each value must be the original user record. First create one [id, user] pair per record.', users, null,
    (input) => Object.fromEntries(input.map((user) => [user.id, user])), 'return Object.fromEntries(input.map((user) => [user.id, user]))', { support: ['map'], difficulty: 'medium' }),
]
