import { define, type Exercise } from '@/lib/exercise-model'
import { iterationLessons } from '@/lib/lessons/iteration'
import { queryLessons } from '@/lib/lessons/queries'
import { reduceLessons } from '@/lib/lessons/reduce'
import { arrayLessons } from '@/lib/lessons/arrays'
import { syntaxLessons } from '@/lib/lessons/syntax'
import { collectionLessons } from '@/lib/lessons/collections'
import { entryLessons } from '@/lib/lessons/entries'
import { nullableLessons } from '@/lib/lessons/nullable'
import { mixedPracticeLessons } from '@/lib/lessons/mixed'
export type { Exercise, Difficulty, PathSlug } from '@/lib/exercise-model'

const baseMixedExercises: Exercise[] = [
  define({
    id: 'active-emails',
    title: 'Emails of active staff',
    difficulty: 'easy',
    path: 'mixed',
    concepts: ['filter', 'map', 'includes'],
    prompt: 'Return the emails of users who are active and whose role is in the allowed list, in original order.',
    approach: 'Keep the active users whose role is allowed, then take each email.',
    solution: `return users
  .filter((user) => user.active && allowedRoles.includes(user.role))
  .map((user) => user.email)`,
    labels: { A: 'users', B: 'allowedRoles' },
    A: [
      { id: 1, name: 'Ada Lovelace', email: 'ada@acme.io', role: 'admin', active: true },
      { id: 2, name: 'Grace Hopper', email: 'grace@acme.io', role: 'editor', active: false },
      { id: 3, name: 'Linus Torvalds', email: 'linus@acme.io', role: 'viewer', active: true },
      { id: 4, name: 'Margaret Hamilton', email: 'margaret@acme.io', role: 'editor', active: true },
      { id: 5, name: 'Ken Thompson', email: 'ken@acme.io', role: 'admin', active: true },
    ],
    B: ['admin', 'editor'],
    reference: (users, roles) => users.filter((u) => u.active && roles.includes(u.role)).map((u) => u.email),
  }),
  define({
    id: 'catalog-by-sku',
    title: 'Index catalog by SKU',
    difficulty: 'easy',
    path: 'mixed',
    concepts: ['object-from-entries', 'map', 'destructuring', 'nullish-coalescing'],
    prompt: 'Build an object keyed by SKU. Each value keeps name and price, where price is replaced by the override in B when one exists.',
    approach: 'Key an object by SKU, and use the override price when one exists.',
    solution: `return Object.fromEntries(
  products.map(({ sku, name, price }) => [sku, { name, price: priceOverrides[sku] ?? price }]),
)`,
    labels: { A: 'products', B: 'priceOverrides' },
    A: [
      { sku: 'KB-01', name: 'Mechanical Keyboard', price: 129, stock: 14 },
      { sku: 'MS-02', name: 'Wireless Mouse', price: 49, stock: 0 },
      { sku: 'HD-03', name: 'USB-C Hub', price: 79, stock: 32 },
      { sku: 'MN-04', name: '27" Monitor', price: 349, stock: 5 },
    ],
    B: { 'MS-02': 39, 'MN-04': 299 } as Record<string, number>,
    reference: (products, overrides) => Object.fromEntries(products.map(({ sku, name, price }) => [sku, { name, price: overrides[sku] ?? price }])),
  }),
  define({
    id: 'flag-transactions',
    title: 'Flag suspicious transactions',
    difficulty: 'easy',
    path: 'mixed',
    concepts: ['filter', 'some', 'map', 'includes', 'destructuring'],
    prompt: 'Return the ids of transactions whose amount exceeds maxAmount, or whose country is blocked, or that contain any blocked tag.',
    approach: 'Keep a transaction when its amount, country, or any tag breaks a rule, then return the id.',
    solution: `return transactions
  .filter(
    (tx) =>
      tx.amount > rules.maxAmount ||
      rules.blockedCountries.includes(tx.country) ||
      tx.tags.some((tag) => rules.blockedTags.includes(tag)),
  )
  .map((tx) => tx.id)`,
    labels: { A: 'transactions', B: 'rules' },
    A: [
      { id: 'tx_101', amount: 120, country: 'US', tags: ['card'] },
      { id: 'tx_102', amount: 9800, country: 'DE', tags: ['wire'] },
      { id: 'tx_103', amount: 45, country: 'KP', tags: ['card'] },
      { id: 'tx_104', amount: 300, country: 'BR', tags: ['card', 'vpn'] },
      { id: 'tx_105', amount: 5000, country: 'AR', tags: ['wire'] },
      { id: 'tx_106', amount: 18, country: 'MX', tags: [] },
    ],
    B: { maxAmount: 5000, blockedCountries: ['KP', 'IR'], blockedTags: ['vpn', 'tor'] },
    reference: (txs, { maxAmount, blockedCountries, blockedTags }) => txs.filter((t) => t.amount > maxAmount || blockedCountries.includes(t.country) || t.tags.some((tag) => blockedTags.includes(tag))).map((t) => t.id),
  }),
  define({
    id: 'order-totals',
    title: 'Order totals per customer',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['reduce', 'find', 'optional-chaining', 'nullish-coalescing', 'nested iteration', 'destructuring'],
    prompt: 'Sum the value of all items (qty × product price) per customerId. Return an object { [customerId]: total }.',
    approach: 'For each order, sum qty times the product price, then add that into the customer total.',
    solution: `return orders.reduce<Record<string, number>>((totals, order) => {
  const total = order.items.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId)
    return sum + item.qty * (product?.price ?? 0)
  }, 0)
  totals[order.customerId] = (totals[order.customerId] ?? 0) + total
  return totals
}, {})`,
    labels: { A: 'orders', B: 'products' },
    A: [
      { id: 'o1', customerId: 'c_ana', items: [{ productId: 'p1', qty: 2 }, { productId: 'p3', qty: 1 }] },
      { id: 'o2', customerId: 'c_ben', items: [{ productId: 'p2', qty: 5 }] },
      { id: 'o3', customerId: 'c_ana', items: [{ productId: 'p2', qty: 1 }] },
      { id: 'o4', customerId: 'c_cai', items: [{ productId: 'p3', qty: 3 }, { productId: 'p1', qty: 1 }] },
    ],
    B: [
      { id: 'p1', name: 'Coffee beans 1kg', price: 24 },
      { id: 'p2', name: 'Paper filters', price: 4 },
      { id: 'p3', name: 'Pour-over kettle', price: 62 },
    ],
    reference: (orders, products) => orders.reduce<Record<string, number>>((acc, order) => { const total = order.items.reduce((sum, { productId, qty }) => sum + qty * (products.find((p) => p.id === productId)?.price ?? 0), 0); acc[order.customerId] = (acc[order.customerId] ?? 0) + total; return acc }, {}),
  }),
  define({
    id: 'user-permissions',
    title: 'Resolve user permissions',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['map', 'flatmap', 'find', 'set', 'spread-rest', 'sort', 'optional-chaining', 'nullish-coalescing', 'destructuring'],
    prompt: 'For each user, collect the permissions of all their roles. Remove duplicates and sort alphabetically. Return [{ name, permissions }].',
    approach: 'Gather the permissions of every role, drop duplicates, and sort them.',
    solution: `return users.map((user) => ({
  name: user.name,
  permissions: [...new Set(user.roleIds.flatMap((id) => roles.find((role) => role.id === id)?.permissions ?? []))].sort(),
}))`,
    labels: { A: 'users', B: 'roles' },
    A: [
      { id: 'u1', name: 'Priya', roleIds: ['r_admin'] },
      { id: 'u2', name: 'Mateo', roleIds: ['r_editor', 'r_billing'] },
      { id: 'u3', name: 'Chen', roleIds: ['r_viewer', 'r_editor'] },
      { id: 'u4', name: 'Sofia', roleIds: [] as string[] },
    ],
    B: [
      { id: 'r_admin', permissions: ['users:write', 'users:read', 'billing:read', 'posts:write'] },
      { id: 'r_editor', permissions: ['posts:write', 'posts:read'] },
      { id: 'r_billing', permissions: ['billing:read', 'billing:write'] },
      { id: 'r_viewer', permissions: ['posts:read'] },
    ],
    reference: (users, roles) => users.map(({ name, roleIds }) => ({ name, permissions: [...new Set(roleIds.flatMap((id) => roles.find((r) => r.id === id)?.permissions ?? []))].sort() })),
  }),
  define({
    id: 'normalize-api',
    title: 'Flatten a JSON:API response',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['destructuring', 'map', 'find', 'optional-chaining'],
    prompt: 'Flatten each item in A.data into { id, title, status, author } where author is the name from the matching entry in B.',
    approach: 'Lift id, title, and status off each article, and look up the author name in B.',
    solution: `return response.data.map((article) => ({
  id: article.id,
  title: article.attributes.title,
  status: article.attributes.status,
  author: included.find((entry) => entry.id === article.relationships.author.id)?.attributes.name,
}))`,
    labels: { A: 'response', B: 'included' },
    A: { meta: { page: 1, total: 3 }, data: [
      { id: 'art_1', type: 'article', attributes: { title: 'Shipping on Fridays', status: 'published' }, relationships: { author: { id: 'au_7' } } },
      { id: 'art_2', type: 'article', attributes: { title: 'Postmortem: the cache incident', status: 'draft' }, relationships: { author: { id: 'au_3' } } },
      { id: 'art_3', type: 'article', attributes: { title: 'Why we moved to edge', status: 'published' }, relationships: { author: { id: 'au_7' } } },
    ]},
    B: [
      { id: 'au_3', type: 'author', attributes: { name: 'Jordan Blake' } },
      { id: 'au_7', type: 'author', attributes: { name: 'Riley Chen' } },
    ],
    reference: (response, included) => response.data.map(({ id, attributes: { title, status }, relationships }) => ({ id, title, status, author: included.find((a) => a.id === relationships.author.id)?.attributes.name })),
  }),
  define({
    id: 'config-diff',
    title: 'Diff two configs',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['Object.keys', 'filter', 'in', 'sort'],
    prompt: 'Compare config A (current) with B (next). Return { added, removed, changed } — arrays of keys, each sorted alphabetically.',
    approach: 'Split the keys into added, removed, and changed, and sort each list.',
    solution: `return {
  added: Object.keys(next).filter((key) => !(key in current)).sort(),
  removed: Object.keys(current).filter((key) => !(key in next)).sort(),
  changed: Object.keys(next).filter((key) => key in current && current[key] !== next[key]).sort(),
}`,
    labels: { A: 'current', B: 'next' },
    A: { region: 'iad1', memory: 1024, timeout: 10, logLevel: 'info', cron: '0 * * * *' } as Record<string, unknown>,
    B: { region: 'fra1', memory: 1024, timeout: 30, logLevel: 'info', maxInstances: 20, fluid: true } as Record<string, unknown>,
    reference: (current, next) => ({ added: Object.keys(next).filter((k) => !(k in current)).sort(), removed: Object.keys(current).filter((k) => !(k in next)).sort(), changed: Object.keys(next).filter((k) => k in current && current[k] !== next[k]).sort() }),
  }),
  define({
    id: 'stock-by-warehouse',
    title: 'Stock per warehouse',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['filter', 'reduce', 'nullish-coalescing', 'destructuring', 'lookup'],
    prompt: 'Total the quantity per warehouse, using the warehouse display name from B as the key. Ignore rows with qty ≤ 0.',
    approach: 'Drop rows with qty of 0 or less, then sum qty under each warehouse display name.',
    solution: `return stockRows.filter((row) => row.qty > 0).reduce<Record<string, number>>((totals, row) => {
  const name = warehouses[row.warehouse]
  totals[name] = (totals[name] ?? 0) + row.qty
  return totals
}, {})`,
    labels: { A: 'stockRows', B: 'warehouses' },
    A: [
      { sku: 'TEE-BLK-M', warehouse: 'BER', qty: 40 }, { sku: 'TEE-BLK-L', warehouse: 'BER', qty: 12 }, { sku: 'TEE-WHT-M', warehouse: 'AMS', qty: 0 }, { sku: 'HOOD-GRY-M', warehouse: 'AMS', qty: 25 }, { sku: 'CAP-NVY', warehouse: 'MAD', qty: -3 }, { sku: 'TEE-BLK-M', warehouse: 'MAD', qty: 8 }, { sku: 'HOOD-GRY-L', warehouse: 'BER', qty: 5 },
    ],
    B: { BER: 'Berlin', AMS: 'Amsterdam', MAD: 'Madrid' } as Record<string, string>,
    reference: (rows, warehouses) => rows.filter((r) => r.qty > 0).reduce<Record<string, number>>((acc, { warehouse, qty }) => { const name = warehouses[warehouse]; acc[name] = (acc[name] ?? 0) + qty; return acc }, {}),
  }),
  define({
    id: 'feature-access',
    title: 'Feature access matrix',
    difficulty: 'hard',
    path: 'mixed',
    concepts: ['every', 'object-entries', 'object-from-entries', 'map', 'filter', 'destructuring', 'includes'],
    prompt: 'For each account, list the features it can use: a feature is available when the account has every flag it requires. Return { [accountId]: features[] } keeping B’s feature order.',
    approach: 'A feature is available when the account has every flag it requires. Keep B’s feature order.',
    solution: `return Object.fromEntries(
  accounts.map((account) => [
    account.id,
    Object.entries(featureRequirements)
      .filter(([, required]) => required.every((flag) => account.flags.includes(flag)))
      .map(([feature]) => feature),
  ]),
)`,
    labels: { A: 'accounts', B: 'featureRequirements' },
    A: [
      { id: 'acc_hobby', plan: 'hobby', flags: ['analytics'] }, { id: 'acc_pro', plan: 'pro', flags: ['analytics', 'sso', 'previews'] }, { id: 'acc_ent', plan: 'enterprise', flags: ['analytics', 'sso', 'previews', 'audit', 'firewall'] },
    ],
    B: { dashboards: ['analytics'], teamLogin: ['sso'], branchDeploys: ['previews'], compliance: ['audit', 'sso'], securityCenter: ['firewall', 'audit', 'analytics'] } as Record<string, string[]>,
    reference: (accounts, requirements) => Object.fromEntries(accounts.map(({ id, flags }) => [id, Object.entries(requirements).filter(([, required]) => required.every((flag) => flags.includes(flag))).map(([feature]) => feature)])),
  }),
  define({
    id: 'monthly-revenue',
    title: 'Monthly revenue summary',
    difficulty: 'hard',
    path: 'mixed',
    concepts: ['filter', 'reduce', 'object-entries', 'sort', 'map', 'destructuring', 'nullish-coalescing', 'includes', 'slice'],
    prompt: 'Only include transactions whose status is in B.includeStatuses. Group by month (YYYY-MM) and return [{ month, total, count }] sorted by month ascending.',
    approach: 'Keep the statuses listed in B, group by YYYY-MM, and sort the months ascending.',
    solution: `const buckets = transactions
  .filter((tx) => options.includeStatuses.includes(tx.status))
  .reduce<Record<string, { total: number; count: number }>>((groups, tx) => {
    const month = tx.date.slice(0, 7)
    const bucket = groups[month] ?? { total: 0, count: 0 }
    groups[month] = { total: bucket.total + tx.amount, count: bucket.count + 1 }
    return groups
  }, {})

return Object.entries(buckets)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([month, { total, count }]) => ({ month, total, count }))`,
    labels: { A: 'transactions', B: 'options' },
    A: [
      { id: 't1', date: '2026-03-02', amount: 1200, status: 'settled' }, { id: 't2', date: '2026-01-15', amount: 300, status: 'settled' }, { id: 't3', date: '2026-01-28', amount: 450, status: 'refunded' }, { id: 't4', date: '2026-02-09', amount: 800, status: 'settled' }, { id: 't5', date: '2026-03-21', amount: 150, status: 'pending' }, { id: 't6', date: '2026-01-30', amount: 90, status: 'settled' }, { id: 't7', date: '2026-03-22', amount: 60, status: 'settled' },
    ],
    B: { includeStatuses: ['settled'] },
    reference: (txs, { includeStatuses }) => Object.entries(txs.filter((t) => includeStatuses.includes(t.status)).reduce<Record<string, { total: number; count: number }>>((acc, { date, amount }) => { const month = date.slice(0, 7); const bucket = acc[month] ?? { total: 0, count: 0 }; acc[month] = { total: bucket.total + amount, count: bucket.count + 1 }; return acc }, {})).sort(([a], [b]) => a.localeCompare(b)).map(([month, { total, count }]) => ({ month, total, count })),
  }),
]

const DIFFICULTY_RANK = { easy: 0, medium: 1, hard: 2 }

// Ordered easy → hard so Mixed Practice ramps up; the sort is stable within each difficulty.
export const mixedExercises: Exercise[] = [...baseMixedExercises, ...mixedPracticeLessons].sort(
  (a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty],
)

export const dedicatedExercises: Exercise[] = [
  ...iterationLessons,
  ...queryLessons,
  ...reduceLessons,
  ...arrayLessons,
  ...syntaxLessons,
  ...collectionLessons,
  ...entryLessons,
  ...nullableLessons,
]

export const exercises: Exercise[] = [...dedicatedExercises, ...mixedExercises]
