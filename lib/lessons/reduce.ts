import { forPath } from './define'

const reduce = forPath('reduce', 'Carry one accumulated value from one iteration into the next. The initial value determines the accumulator shape; always return the next accumulator.')

export const reduceLessons = [
  reduce('reduce-sum-numbers', 'Sum numbers', 'Use reduce with initial value 0 to return the sum.', [10, 20, 30, 40], null,
    (input) => input.reduce((total, value) => total + value, 0), 'return input.reduce((total, value) => total + value, 0)', { stage: 'Number accumulator' }),
  reduce('reduce-multiply-numbers', 'Multiply numbers', 'Use reduce to return the product of all numbers. Start at 1, not 0.', [2, 3, 4], null,
    (input) => input.reduce((product, value) => product * value, 1), 'return input.reduce((product, value) => product * value, 1)', { stage: 'Number accumulator' }),
  reduce('reduce-count-active', 'Count matching items', 'Use reduce to count active records. Perform the condition in the reduction; do not filter first.', [{ active: true }, { active: false }, { active: true }], null,
    (input) => input.reduce((count, item) => item.active ? count + 1 : count, 0), 'return input.reduce((count, item) => item.active ? count + 1 : count, 0)', { stage: 'Number with conditions' }),
  reduce('reduce-maximum', 'Maximum value', 'Use reduce to return the maximum of this non-empty array. Start with input[0]; do not sort or use Math.max.', [5, 18, 3, 41, 12], null,
    (input) => input.reduce((maximum, value) => value > maximum ? value : maximum, input[0]), 'return input.reduce((maximum, value) => value > maximum ? value : maximum, input[0])', { stage: 'Number with conditions' }),
  reduce('reduce-build-string', 'Build a string', 'Use reduce to combine names with ", " between them, with no leading or trailing separator.', ['Ana', 'Bruno', 'Carla'], null,
    (input) => input.reduce((text, name) => text === '' ? name : text + ', ' + name, ''), 'return input.reduce((text, name) => text === "" ? name : text + ", " + name, "")', { stage: 'String accumulator', difficulty: 'medium' }),
  reduce('reduce-build-array', 'Build an array', 'Use an array accumulator to collect each number doubled. Append with push, then return the accumulator.', [1, 3, 5], null,
    (input) => input.reduce<number[]>((result, value) => { result.push(value * 2); return result }, []), 'return input.reduce<number[]>((result, value) => {\n  result.push(value * 2)\n  return result\n}, [])', { stage: 'Array accumulator', difficulty: 'medium' }),
  reduce('reduce-count-by-category', 'Count by category', 'Return an object with a count for each category. The object accumulator itself is the final result.', [{ category: 'food' }, { category: 'books' }, { category: 'food' }], null,
    (input) => input.reduce<Record<string, number>>((counts, item) => { if (counts[item.category] === undefined) counts[item.category] = 0; counts[item.category] += 1; return counts }, {}), 'return input.reduce<Record<string, number>>((counts, item) => {\n  if (counts[item.category] === undefined) counts[item.category] = 0\n  counts[item.category] += 1\n  return counts\n}, {})', { stage: 'Object accumulator', difficulty: 'medium' }),
  reduce('reduce-sum-by-category', 'Sum values by category', 'Return an object containing the total amount per category. Do not convert the accumulator to entries.', [{ category: 'food', amount: 20 }, { category: 'books', amount: 25 }, { category: 'food', amount: 22 }], null,
    (input) => input.reduce<Record<string, number>>((totals, item) => { if (totals[item.category] === undefined) totals[item.category] = 0; totals[item.category] += item.amount; return totals }, {}), 'return input.reduce<Record<string, number>>((totals, item) => {\n  if (totals[item.category] === undefined) totals[item.category] = 0\n  totals[item.category] += item.amount\n  return totals\n}, {})', { stage: 'Object accumulator', difficulty: 'medium' }),
]
