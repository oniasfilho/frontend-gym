import { forPath } from './define'

const position = forPath('array-position', 'find returns the matching item; findIndex returns its position. For simple values such as strings or numbers, includes answers "is it there?" and indexOf answers "where is it?". Both findIndex and indexOf return -1 when nothing matches.')
const extraction = forPath('array-extraction', 'slice(start, end) copies part of an array: start is included, end is excluded, and the original stays untouched. reverse() flips the order in place: it mutates the array it is called on. toReversed() returns a reversed copy and leaves the original alone.')

export const arrayHelperLessons = [
  position('array-position-status-index', 'Find status position', 'Return the position of the status in extra. Statuses are plain strings, so use indexOf.', ['draft', 'pending', 'approved'], 'pending',
    (input, extra) => input.indexOf(extra), 'return input.indexOf(extra)'),
  position('array-position-role-membership', 'Check role membership', 'Return whether the role in extra is in the list. Roles are plain strings, so use includes.', ['admin', 'editor', 'viewer'], 'editor',
    (input, extra) => input.includes(extra), 'return input.includes(extra)'),
  position('array-position-first-unavailable', 'First unavailable product', 'Return the position of the first product with no stock. Products are objects, so match them with findIndex.',
    [{ name: 'Keyboard', stock: 4 }, { name: 'Mouse', stock: 2 }, { name: 'Monitor', stock: 0 }, { name: 'Cable', stock: 5 }], null,
    (input) => input.findIndex((product) => product.stock === 0), 'return input.findIndex((product) => product.stock === 0)'),
  position('array-position-first-invalid-field', 'First invalid form field', 'Return the position of the first field that is not valid.',
    [{ field: 'name', valid: true }, { field: 'email', valid: true }, { field: 'phone', valid: false }, { field: 'address', valid: false }], null,
    (input) => input.findIndex((field) => !field.valid), 'return input.findIndex((field) => !field.valid)'),
  position('array-position-mark-selected', 'Mark selected item', 'First use findIndex to get the position of the item whose id is in extra. Then return every item as { id, selected }, where selected is true only at that position.',
    [{ id: 'p1', selected: false }, { id: 'p2', selected: false }, { id: 'p3', selected: false }], 'p2',
    (input, extra) => {
      const index = input.findIndex((item) => item.id === extra)
      return input.map((item, currentIndex) => ({ id: item.id, selected: currentIndex === index }))
    },
    'const index = input.findIndex((item) => item.id === extra)\n\nreturn input.map((item, currentIndex) => ({\n  id: item.id,\n  selected: currentIndex === index,\n}))', { support: ['map'], difficulty: 'medium' }),

  extraction('array-extraction-reverse-ids', 'Reverse IDs', 'Return the IDs in reverse order. reverse() works here: it flips the array in place and returns that same array.', ['a', 'b', 'c'], null,
    (input) => input.toReversed(), 'return input.reverse()'),
  extraction('array-extraction-newest-first', 'Newest notifications first', 'The notifications are oldest first. Return the same objects newest first without mutating input, so use toReversed() for a reversed copy.',
    [{ id: 1, createdAt: '10:00' }, { id: 2, createdAt: '11:00' }, { id: 3, createdAt: '12:00' }], null,
    (input) => input.toReversed(), 'return input.toReversed()'),
  extraction('array-extraction-first-n', 'First N results', 'Return the first extra results. slice(0, n) takes the items from position 0 up to, but not including, position n.', ['a', 'b', 'c', 'd', 'e'], 3,
    (input, extra) => input.slice(0, extra), 'return input.slice(0, extra)'),
  extraction('array-extraction-paginate', 'Paginate records', 'Return the records on the page described by extra. Pages start at 1: page 1 holds the first pageSize records, page 2 the next pageSize, and so on.', ['a', 'b', 'c', 'd', 'e', 'f'], { page: 2, pageSize: 2 },
    (input, extra) => { const start = (extra.page - 1) * extra.pageSize; return input.slice(start, start + extra.pageSize) },
    'const start = (extra.page - 1) * extra.pageSize\nconst end = start + extra.pageSize\n\nreturn input.slice(start, end)', { difficulty: 'medium' }),
  extraction('array-extraction-latest-n', 'Latest N events', 'The events are in chronological order. Return the latest extra events, newest first, without mutating input.', ['login', 'search', 'view', 'purchase', 'logout'], 3,
    (input, extra) => input.toReversed().slice(0, extra), 'return input.toReversed().slice(0, extra)', { difficulty: 'medium' }),
]
