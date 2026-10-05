import { forPath } from './define'

const destructure = forPath('destructuring', 'Destructuring binds selected values to local names. Array positions and object property names determine which values you extract.')
const spread = forPath('spread-rest', 'Spread expands values into a new array or object. Rest collects the values that were not extracted. Neither requires changing the original input.')

export const syntaxLessons = [
  destructure('destructuring-first-second', 'First and second values', 'Use array destructuring to return { first, second } from the first two input values.', [10, 20, 30], null,
    (input) => { const [first, second] = input; return { first, second } }, 'const [first, second] = input\nreturn { first, second }'),
  destructure('destructuring-skip-item', 'Skip an array item', 'Use array destructuring to return the first and third values as { first, third }, skipping the second.', ['Ana', 'Bruno', 'Carla'], null,
    (input) => { const [first, , third] = input; return { first, third } }, 'const [first, , third] = input\nreturn { first, third }'),
  destructure('destructuring-object-properties', 'Extract object properties', 'Use object destructuring to return only { name, age }.', { id: 1, name: 'Ana', age: 24 }, null,
    (input) => { const { name, age } = input; return { name, age } }, 'const { name, age } = input\nreturn { name, age }'),
  destructure('destructuring-rename-property', 'Rename an extracted property', 'Destructure name into a variable called displayName and return { displayName }.', { id: 1, name: 'Ana' }, null,
    (input) => { const { name: displayName } = input; return { displayName } }, 'const { name: displayName } = input\nreturn { displayName }'),
  destructure('destructuring-default', 'Use a default value', 'Destructure theme with the default "light" and return it. The default applies to undefined, not null.', { theme: undefined } as { theme?: string }, null,
    (input) => { const { theme = 'light' } = input; return theme }, 'const { theme = "light" } = input\nreturn theme'),
  destructure('destructuring-nested-profile', 'Nested object destructuring', 'Use nested destructuring to extract and return the city from profile.address.', { profile: { name: 'Ana', address: { city: 'Recife' } } }, null,
    (input) => { const { profile: { address: { city } } } = input; return city }, 'const { profile: { address: { city } } } = input\nreturn city', { difficulty: 'medium' }),

  spread('spread-copy-array', 'Copy an array', 'Use spread to return a new array containing the same values in the same order.', [2, 4, 6], null,
    (input) => [...input], 'return [...input]'),
  spread('spread-append-items', 'Append immutably', 'Use spread to return a new array containing input followed by the number in extra. Leave input unchanged.', [2, 4, 6], 8,
    (input, extra) => [...input, extra], 'return [...input, extra]'),
  spread('spread-merge-arrays', 'Merge two arrays', 'Use spread to return a new array containing input followed by extra, preserving duplicates and order.', ['Ana', 'Bruno'], ['Carla', 'Ana'],
    (input, extra) => [...input, ...extra], 'return [...input, ...extra]'),
  spread('spread-update-object', 'Update an object immutably', 'Return a copy of input with active set to the boolean in extra. Preserve other fields without mutating input.', { id: 1, name: 'Ana', active: false }, true,
    (input, extra) => ({ ...input, active: extra }), 'return { ...input, active: extra }'),
  spread('rest-object-properties', 'Collect remaining properties', 'Extract id and collect the remaining properties using rest. Return { id, details }, where details contains every property except id.', { id: 1, name: 'Ana', active: true }, null,
    (input) => { const { id, ...details } = input; return { id, details } }, 'const { id, ...details } = input\nreturn { id, details }', { support: ['destructuring'], difficulty: 'medium' }),
  spread('rest-array-tail', 'Head and remaining items', 'Extract the first value as head and collect all remaining values as tail using rest. Return { head, tail }.', [10, 20, 30, 40], null,
    (input) => { const [head, ...tail] = input; return { head, tail } }, 'const [head, ...tail] = input\nreturn { head, tail }', { support: ['destructuring'], difficulty: 'medium' }),
]
