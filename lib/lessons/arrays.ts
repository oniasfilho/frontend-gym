import { forPath, products, users } from './define'

const flatMap = forPath('flatmap', 'Return an array from each callback. flatMap flattens those returned arrays by one level: one input can produce zero, one, or many outputs.')
const sort = forPath('sort', 'A comparator returns a negative number to put a before b, a positive number to put b first, or zero for a tie. toSorted returns a new array; sort mutates the original.')

export const arrayLessons = [
  flatMap('flatmap-duplicate-numbers', 'Duplicate every number', 'Return each number twice, next to itself, in one flat array.', [1, 2, 3], null,
    (input) => input.flatMap((value) => [value, value]), 'return input.flatMap((value) => [value, value])'),
  flatMap('flatmap-word-characters', 'Words into characters', 'Return one flat array of the characters in these words. split("") gives the characters of a word.', ['cat', 'dog', 'ox'], null,
    (input) => input.flatMap((word) => word.split('')), 'return input.flatMap((word) => word.split(""))'),
  flatMap('flatmap-order-item-ids', 'Collect order item IDs', 'Each order already contains an itemIds array. Return all item IDs in one array, keeping order.', [{ itemIds: [1, 2] }, { itemIds: [3] }, { itemIds: [4, 5] }], null,
    (input) => input.flatMap((order) => order.itemIds), 'return input.flatMap((order) => order.itemIds)'),
  flatMap('flatmap-team-members', 'Collect team members', 'Return all member names from all teams in one array. Keep team order and member order.', [{ name: 'Red', members: ['Ana', 'Bruno'] }, { name: 'Blue', members: ['Carla'] }, { name: 'Green', members: [] as string[] }], null,
    (input) => input.flatMap((team) => team.members), 'return input.flatMap((team) => team.members)'),
  flatMap('flatmap-sentence-words', 'Sentences into words', 'Return one flat array of words. These sentences use exactly one space between words; split(" ") separates them.', ['learn one thing', 'practice it', 'repeat daily'], null,
    (input) => input.flatMap((sentence) => sentence.split(' ')), 'return input.flatMap((sentence) => sentence.split(" "))'),
  flatMap('flatmap-positive-doubles', 'Transform or remove', 'Return positive numbers doubled and omit zero and negatives. Use flatMap by returning [] or [value], not filter followed by map.', [-2, 0, 3, 5], null,
    (input) => input.flatMap((value) => value > 0 ? [value * 2] : []), 'return input.flatMap((value) => value > 0 ? [value * 2] : [])', { difficulty: 'medium' }),

  sort('sort-numbers-ascending', 'Numbers ascending', 'Return numbers from smallest to largest using toSorted. Do not mutate input. Numeric order is not the default string order.', [10, 2, 30, 1], null,
    (input) => input.toSorted((a, b) => a - b), 'return input.toSorted((a, b) => a - b)'),
  sort('sort-numbers-descending', 'Numbers descending', 'Use toSorted to return numbers from largest to smallest without mutating input.', [10, 2, 30, 1], null,
    (input) => input.toSorted((a, b) => b - a), 'return input.toSorted((a, b) => b - a)'),
  sort('sort-strings-alphabetically', 'Strings alphabetically', 'Return a new array of these lowercase words in alphabetical order. Do not mutate input.', ['pear', 'apple', 'banana'], null,
    (input) => input.toSorted(), 'return input.toSorted()'),
  sort('sort-products-by-price', 'Products by price', 'Return the original product objects ordered by price ascending in a new array. Do not mutate input.', products, null,
    (input) => input.toSorted((a, b) => a.price - b.price), 'return input.toSorted((a, b) => a.price - b.price)'),
  sort('sort-users-by-name', 'Users by name', 'Return a new array of users ordered by name alphabetically. Compare strings with localeCompare; keep the objects unchanged.', [users[2], users[0], users[1]], null,
    (input) => input.toSorted((a, b) => a.name.localeCompare(b.name)), 'return input.toSorted((a, b) => a.name.localeCompare(b.name)'),
  sort('sort-score-then-name', 'Score, then name', 'Return a new array ordered by score descending. When scores tie, order names alphabetically. Do not mutate input.', [{ name: 'Carla', score: 90 }, { name: 'Bruno', score: 75 }, { name: 'Ana', score: 90 }], null,
    (input) => input.toSorted((a, b) => { if (a.score !== b.score) return b.score - a.score; return a.name.localeCompare(b.name) }), 'return input.toSorted((a, b) => {\n  if (a.score !== b.score) return b.score - a.score\n  return a.name.localeCompare(b.name)\n})', { difficulty: 'medium' }),
]
