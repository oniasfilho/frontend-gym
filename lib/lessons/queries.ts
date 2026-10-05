import { forPath, products, users } from './define'

const filter = forPath('filter', 'Keep an original item only when the condition is true. Do not transform it: the kind of element stays the same, while the number of elements can change.')
const find = forPath('find', 'Return the first matching element itself, not an array or a boolean. If nothing matches, find returns undefined.')
const some = forPath('some', 'Does ANY item match? Return only true or false. One matching item is enough; an empty array returns false.')
const every = forPath('every', 'Do ALL items match? Return only true or false. One failing item is enough to return false; an empty array returns true.')

export const queryLessons = [
  filter('filter-positive-numbers', 'Keep positive numbers', 'Return the original numbers greater than zero.', [-3, 0, 2, 7, -1], null,
    (input) => input.filter((value) => value > 0), 'return input.filter((value) => value > 0)'),
  filter('filter-even-numbers', 'Keep even numbers', 'Return the original even numbers, in input order.', [1, 2, 3, 4, 6], null,
    (input) => input.filter((value) => value % 2 === 0), 'return input.filter((value) => value % 2 === 0)'),
  filter('filter-active-users', 'Keep active users', 'Return the complete original user objects whose active field is true, not their names or IDs.', users, null,
    (input) => input.filter((user) => user.active), 'return input.filter((user) => user.active)'),
  filter('filter-in-stock', 'Keep products in stock', 'Return the original products with stock greater than zero.', products, null,
    (input) => input.filter((product) => product.stock > 0), 'return input.filter((product) => product.stock > 0)'),
  filter('filter-prices-below-limit', 'Keep prices below a limit', 'Return prices strictly below the limit in extra.', [10, 25, 50, 80], 50,
    (input, extra) => input.filter((price) => price < extra), 'return input.filter((price) => price < extra)'),
  filter('filter-long-strings', 'Keep longer strings', 'Return strings whose length is strictly greater than extra.', ['cat', 'bird', 'elephant', 'ox'], 3,
    (input, extra) => input.filter((word) => word.length > extra), 'return input.filter((word) => word.length > extra)'),
  filter('filter-adult-users', 'Keep adult users', 'Return the original users aged 18 or older.', users, null,
    (input) => input.filter((user) => user.age >= 18), 'return input.filter((user) => user.age >= 18)'),
  filter('filter-completed-tasks', 'Keep completed tasks', 'Return complete original task objects with completed set to true.', [{ id: 1, completed: true }, { id: 2, completed: false }, { id: 3, completed: true }], null,
    (input) => input.filter((task) => task.completed), 'return input.filter((task) => task.completed)'),
  filter('filter-active-adults', 'Meet two conditions', 'Keep original users who are both active and at least 18 years old.', [...users, { id: 4, name: 'Davi', active: true, age: 16 }], null,
    (input) => input.filter((user) => user.active && user.age >= 18), 'return input.filter((user) => user.active && user.age >= 18)', { difficulty: 'medium' }),
  filter('filter-remove-blocked', 'Remove blocked records', 'Keep the original records that are not blocked. Preserve their order and all fields.', [{ id: 1, blocked: false }, { id: 2, blocked: true }, { id: 3, blocked: false }], null,
    (input) => input.filter((record) => !record.blocked), 'return input.filter((record) => !record.blocked)', { difficulty: 'medium' }),

  find('find-first-even', 'First even number', 'Return the first even number, not all even numbers.', [3, 7, 4, 8, 2], null,
    (input) => input.find((value) => value % 2 === 0), 'return input.find((value) => value % 2 === 0)'),
  find('find-user-by-id', 'Find a user by ID', 'Return the original user whose id matches extra.', users, 2,
    (input, extra) => input.find((user) => user.id === extra), 'return input.find((user) => user.id === extra)'),
  find('find-first-inactive', 'First inactive user', 'Return the first original user whose active field is false.', users, null,
    (input) => input.find((user) => !user.active), 'return input.find((user) => !user.active)'),
  find('find-product-by-sku', 'Find a product by SKU', 'Return the original product with the SKU in extra.', products, 'M1',
    (input, extra) => input.find((product) => product.sku === extra), 'return input.find((product) => product.sku === extra)'),
  find('find-price-above-limit', 'First price above a limit', 'Return the first price strictly greater than extra. If none matches, return undefined.', [10, 20, 30], 40,
    (input, extra) => input.find((price) => price > extra), 'return input.find((price) => price > extra)'),
  find('find-affordable-in-stock', 'First affordable available product', 'Return the first original product with stock greater than zero and price no greater than extra.', products, 50,
    (input, extra) => input.find((product) => product.stock > 0 && product.price <= extra), 'return input.find((product) => product.stock > 0 && product.price <= extra)', { difficulty: 'medium' }),

  some('some-negative-number', 'Any negative number?', 'Return whether any number is negative.', [4, 0, -2, 8], null,
    (input) => input.some((value) => value < 0), 'return input.some((value) => value < 0)'),
  some('some-inactive-user', 'Any inactive user?', 'Return whether any user is inactive; do not return the user.', users, null,
    (input) => input.some((user) => !user.active), 'return input.some((user) => !user.active)'),
  some('some-out-of-stock', 'Any unavailable product?', 'Return whether any product has stock equal to zero.', products, null,
    (input) => input.some((product) => product.stock === 0), 'return input.some((product) => product.stock === 0)'),
  some('some-transaction-exceeds-limit', 'Any transaction above the limit?', 'Return whether any transaction amount is strictly greater than extra.', [{ amount: 10 }, { amount: 40 }, { amount: 25 }], 50,
    (input, extra) => input.some((transaction) => transaction.amount > extra), 'return input.some((transaction) => transaction.amount > extra)'),
  some('some-task-needs-attention', 'Any task needing attention?', 'Return whether any task is urgent and not completed.', [{ urgent: true, completed: true }, { urgent: false, completed: false }, { urgent: true, completed: false }], null,
    (input) => input.some((task) => task.urgent && !task.completed), 'return input.some((task) => task.urgent && !task.completed)', { difficulty: 'medium' }),

  every('every-positive-number', 'All numbers positive?', 'Return whether all numbers are strictly positive.', [1, 3, 5, 7], null,
    (input) => input.every((value) => value > 0), 'return input.every((value) => value > 0)'),
  every('every-active-user', 'All users active?', 'Return whether all users are active.', users, null,
    (input) => input.every((user) => user.active), 'return input.every((user) => user.active)'),
  every('every-product-in-stock', 'All products available?', 'Return whether every product has stock greater than zero.', products, null,
    (input) => input.every((product) => product.stock > 0), 'return input.every((product) => product.stock > 0)'),
  every('every-score-passing', 'All scores passing?', 'Return whether every score is at least the passing score in extra.', [60, 72, 80, 95], 60,
    (input, extra) => input.every((score) => score >= extra), 'return input.every((score) => score >= extra)'),
  every('every-record-valid', 'All records meet both requirements?', 'Return whether every record is active and has a score of at least 60.', [{ active: true, score: 80 }, { active: true, score: 60 }, { active: true, score: 95 }], null,
    (input) => input.every((record) => record.active && record.score >= 60), 'return input.every((record) => record.active && record.score >= 60)', { difficulty: 'medium' }),
]
