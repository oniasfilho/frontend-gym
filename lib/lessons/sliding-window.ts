import { forPath } from './define'

const slide = forPath('sliding-window', 'Keep a moving range with explicit left and right indexes. When an edge moves, update the window state in constant time instead of recomputing the whole window.')

export const slidingWindowLessons = [
  slide('window-init-sum', 'Sum the first window', 'Return the sum of the first extra values of input. This is the starting state for every sliding window.', [4, 2, 7, 1], 3,
    (input, extra) => { let sum = 0; for (let i = 0; i < extra; i++) sum += input[i]; return sum },
    'let sum = 0\nfor (let i = 0; i < extra; i++) sum += input[i]\nreturn sum', { stage: 'Window initialization' }),

  slide('window-slide-sum', 'Slide the window one step', 'extra describes a window of size k with the given sum, and index is the position of the value entering on the right. Return the sum after the window moves one step right, removing the value that leaves on the left.', [2, 1, 5, 1, 3, 2], { sum: 8, k: 3, index: 3 },
    (input, extra) => extra.sum + input[extra.index] - input[extra.index - extra.k],
    'return extra.sum + input[extra.index] - input[extra.index - extra.k]', { stage: 'Fixed window' }),

  slide('window-best-fixed', 'Largest fixed-size window', 'Return the largest sum of any extra consecutive values in input. Compute the first window, then slide it one step at a time, keeping track of the best sum seen.', [2, 1, 5, 1, 3, 2], 3,
    (input, extra) => {
      let windowSum = 0
      for (let i = 0; i < extra; i++) windowSum += input[i]
      let best = windowSum
      for (let i = extra; i < input.length; i++) {
        windowSum += input[i] - input[i - extra]
        best = Math.max(best, windowSum)
      }
      return best
    },
    'let windowSum = 0\nfor (let i = 0; i < extra; i++) windowSum += input[i]\nlet best = windowSum\nfor (let i = extra; i < input.length; i++) {\n  windowSum += input[i] - input[i - extra]\n  best = Math.max(best, windowSum)\n}\nreturn best', { stage: 'Fixed window', difficulty: 'medium' }),

  slide('window-expand-right', 'Expand until the target is reached', 'Starting at the first value, add values from the left until the running sum is at least extra. Return the index where that happens, or -1 if the sum never reaches extra.', [2, 3, 1, 2, 4, 3], 7,
    (input, extra) => {
      let sum = 0
      for (let right = 0; right < input.length; right++) {
        sum += input[right]
        if (sum >= extra) return right
      }
      return -1
    },
    'let sum = 0\nfor (let right = 0; right < input.length; right++) {\n  sum += input[right]\n  if (sum >= extra) return right\n}\nreturn -1', { stage: 'Expanding' }),

  slide('window-shrink-left', 'Shrink from the left', 'extra is { left, right, target }, where [left, right] is the current window. While the window sum is at least target, remove input[left] from the sum and advance left. Return { left, sum } once the sum drops below target. The scaffold computes the starting sum.', [2, 3, 1, 2, 4, 3], { left: 0, right: 4, target: 7 },
    (input, extra) => {
      let sum = 0
      for (let k = extra.left; k <= extra.right; k++) sum += input[k]
      let { left } = extra
      while (sum >= extra.target) {
        sum -= input[left]
        left++
      }
      return { left, sum }
    },
    'let { left } = extra\nwhile (sum >= extra.target) {\n  sum -= input[left]\n  left++\n}\nreturn { left, sum }', {
      stage: 'Shrinking',
      difficulty: 'medium',
      setup: 'let sum = 0\n  for (let k = extra.left; k <= extra.right; k++) sum += input[k]',
    }),

  slide('window-remove-count', 'Remove a value from window counts', 'extra.counts is a Map of how many times each value is in the window. extra.leave is the index of the value leaving the window. Decrement its count, delete the key when the count reaches zero, and return the number of distinct values left.', ['a', 'b', 'a', 'c'], { counts: new Map([['a', 2], ['b', 1], ['c', 1]]), leave: 0 },
    (input, extra) => {
      const value = input[extra.leave]
      const count = (extra.counts.get(value) ?? 0) - 1
      if (count === 0) extra.counts.delete(value)
      else extra.counts.set(value, count)
      return extra.counts.size
    },
    'const value = input[extra.leave]\nconst count = (extra.counts.get(value) ?? 0) - 1\nif (count === 0) extra.counts.delete(value)\nelse extra.counts.set(value, count)\nreturn extra.counts.size', { stage: 'Window state', difficulty: 'medium' }),

  slide('window-validity-distinct', 'At most k distinct values', 'input holds the values in the current window, and extra is the most distinct values allowed. Return true if the window has at most extra distinct values, otherwise false.', ['a', 'b', 'a'], 1,
    (input, extra) => new Set(input).size <= extra,
    'return new Set(input).size <= extra', { stage: 'Validity' }),

  slide('window-min-length', 'Shortest window with sum at least target', 'Return the length of the shortest contiguous run of input whose sum is at least extra. Record the length inside the shrink loop, since each valid window is a candidate. Return 0 if no window qualifies.', [2, 3, 1, 2, 4, 3], 7,
    (input, extra) => {
      let best = Infinity
      let sum = 0
      let left = 0
      for (let right = 0; right < input.length; right++) {
        sum += input[right]
        while (sum >= extra) {
          best = Math.min(best, right - left + 1)
          sum -= input[left]
          left++
        }
      }
      return best === Infinity ? 0 : best
    },
    'let best = Infinity\nlet sum = 0\nlet left = 0\nfor (let right = 0; right < input.length; right++) {\n  sum += input[right]\n  while (sum >= extra) {\n    best = Math.min(best, right - left + 1)\n    sum -= input[left]\n    left++\n  }\n}\nreturn best === Infinity ? 0 : best', { stage: 'Recording answers', difficulty: 'hard' }),

  slide('window-longest-unique', 'Longest substring without repeats', 'Return the length of the longest substring of input that has no repeated characters. Keep a Set of the characters in the window, shrink from the left while the next character is already in it, and track the best length.', 'abcabcbb', null,
    (input) => {
      const seen = new Set<string>()
      let left = 0
      let best = 0
      for (let right = 0; right < input.length; right++) {
        while (seen.has(input[right])) {
          seen.delete(input[left])
          left++
        }
        seen.add(input[right])
        best = Math.max(best, right - left + 1)
      }
      return best
    },
    'const seen = new Set()\nlet left = 0\nlet best = 0\nfor (let right = 0; right < input.length; right++) {\n  while (seen.has(input[right])) {\n    seen.delete(input[left])\n    left++\n  }\n  seen.add(input[right])\n  best = Math.max(best, right - left + 1)\n}\nreturn best', { stage: 'Combined', difficulty: 'hard' }),
]
