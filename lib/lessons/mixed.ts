import { define, type Exercise } from '@/lib/exercise-model'

const byCountThenName = <T extends { count: number }>(key: (item: T) => string) => (a: T, b: T) => b.count - a.count || key(a).localeCompare(key(b))

export const mixedPracticeLessons: Exercise[] = [
  define({
    id: 'normalize-customer-emails',
    title: 'Normalize customer emails',
    difficulty: 'easy',
    path: 'mixed',
    concepts: ['map', 'filter', 'some', 'toLowerCase', 'endsWith'],
    prompt: 'Return the emails of users whose domain is approved, lowercased, in original order. A domain is approved only when the email ends with "@" followed by exactly that domain.',
    approach: 'Lowercase every email first, then keep the ones that end with "@" plus any approved domain.',
    solution: `return users
  .map((user) => user.email.toLowerCase())
  .filter((email) => approvedDomains.some((domain) => email.endsWith(\`@\${domain}\`)))`,
    labels: { A: 'users', B: 'approvedDomains' },
    A: [
      { id: 1, name: 'Ada Lovelace', email: 'Ada@ACME.io' },
      { id: 2, name: 'Grace Hopper', email: 'grace@gmail.com' },
      { id: 3, name: 'Linus Torvalds', email: 'LINUS@Globex.com' },
      { id: 4, name: 'Mallory', email: 'mallory@acme.io.example.net' },
      { id: 5, name: 'Ken Thompson', email: 'ken@acme.io' },
    ],
    B: ['acme.io', 'globex.com'],
    reference: (users, domains) => users.map((u) => u.email.toLowerCase()).filter((email) => domains.some((d) => email.endsWith(`@${d}`))),
  }),
  define({
    id: 'build-display-names',
    title: 'Build display names',
    difficulty: 'easy',
    path: 'mixed',
    concepts: ['map', 'split', 'join', 'toUpperCase'],
    prompt: 'Turn each snake_case username into an uppercase display name with words separated by single spaces, e.g. "ada_lovelace" → "ADA LOVELACE". The extra input is unused.',
    approach: 'Split each username on "_", join the parts with spaces, then uppercase the result.',
    solution: `return usernames.map((username) => username.split('_').join(' ').toUpperCase())`,
    labels: { A: 'usernames', B: 'extra' },
    A: ['ada_lovelace', 'grace_brewster_hopper', 'linus', 'margaret_hamilton'],
    B: null,
    reference: (usernames) => usernames.map((u) => u.split('_').join(' ').toUpperCase()),
  }),
  define({
    id: 'reverse-breadcrumbs',
    title: 'Reverse breadcrumb paths',
    difficulty: 'easy',
    path: 'mixed',
    concepts: ['map', 'split', 'reverse', 'join'],
    prompt: 'Turn each slash-separated path into a breadcrumb that starts from the deepest segment, joined with the separator, e.g. "home/products/keyboards" → "keyboards > products > home".',
    approach: 'Split each path on "/", reverse the segments, then join them with the separator.',
    solution: `return paths.map((path) => path.split('/').reverse().join(separator))`,
    labels: { A: 'paths', B: 'separator' },
    A: ['home/products/keyboards', 'home/blog', 'account/settings/security/2fa', 'about'],
    B: ' > ',
    reference: (paths, separator) => paths.map((p) => p.split('/').reverse().join(separator)),
  }),
  define({
    id: 'first-invalid-order',
    title: 'Find first invalid order',
    difficulty: 'easy',
    path: 'mixed',
    concepts: ['findIndex', 'includes'],
    prompt: 'Return the index of the first order whose status is not one of the allowed statuses, or -1 when every order is valid.',
    approach: 'Search for the first position where the status is missing from the allowed list.',
    solution: `return orders.findIndex((order) => !allowedStatuses.includes(order.status))`,
    labels: { A: 'orders', B: 'allowedStatuses' },
    A: [
      { id: 'o-101', status: 'paid' },
      { id: 'o-102', status: 'shipped' },
      { id: 'o-103', status: 'pending' },
      { id: 'o-104', status: 'lost' },
      { id: 'o-105', status: 'paid' },
      { id: 'o-106', status: 'unknown' },
    ],
    B: ['pending', 'paid', 'shipped', 'delivered'],
    reference: (orders, allowed) => orders.findIndex((o) => !allowed.includes(o.status)),
  }),
  define({
    id: 'route-api-requests',
    title: 'Route API requests',
    difficulty: 'easy',
    path: 'mixed',
    concepts: ['map', 'find', 'startsWith', 'nullish-coalescing', 'optional-chaining'],
    prompt: 'Return { path, group } for each request path. The group comes from the first route whose prefix the path starts with; paths that match no route get the group "page".',
    approach: 'For each path, find the first route whose prefix it starts with, and fall back to "page".',
    solution: `return requests.map((path) => ({
  path,
  group: routes.find((route) => path.startsWith(route.prefix))?.group ?? 'page',
}))`,
    labels: { A: 'requests', B: 'routes' },
    A: ['/api/users', '/admin/settings', '/assets/logo.svg', '/about', '/api/orders/42', '/administrator'],
    B: [
      { prefix: '/api/', group: 'api' },
      { prefix: '/admin/', group: 'admin' },
      { prefix: '/assets/', group: 'static' },
    ],
    reference: (requests, routes) => requests.map((path) => ({ path, group: routes.find((r) => path.startsWith(r.prefix))?.group ?? 'page' })),
  }),
  define({
    id: 'unique-normalized-tags',
    title: 'Unique normalized tags',
    difficulty: 'easy',
    path: 'mixed',
    concepts: ['flatmap', 'map', 'set', 'spread-rest', 'sort', 'toLowerCase'],
    prompt: 'Return every tag used across all articles, lowercased, without duplicates, sorted alphabetically. The extra input is unused.',
    approach: 'Flatten all tags, lowercase them, let a Set drop duplicates, then spread it into an array and sort.',
    solution: `return [...new Set(articles.flatMap((article) => article.tags).map((tag) => tag.toLowerCase()))].sort()`,
    labels: { A: 'articles', B: 'extra' },
    A: [
      { title: 'Intro to Maps', tags: ['JavaScript', 'Collections'] },
      { title: 'Sets in practice', tags: ['javascript', 'collections', 'Performance'] },
      { title: 'Shipping faster', tags: ['performance', 'DX'] },
      { title: 'Untitled draft', tags: [] },
    ],
    B: null,
    reference: (articles) => [...new Set(articles.flatMap((a) => a.tags).map((t) => t.toLowerCase()))].sort(),
  }),
  define({
    id: 'count-product-tags',
    title: 'Count product tags',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['map-collection', 'flatmap', 'Array.from', 'sort'],
    prompt: 'Count how many products use each tag. Return { tag, count }[] sorted by count descending, then by tag alphabetically. The extra input is unused.',
    approach: 'Tally tags in a Map, turn its entries into objects, then sort by count and break ties by name.',
    solution: `const counts = new Map<string, number>()
for (const tag of products.flatMap((product) => product.tags)) {
  counts.set(tag, (counts.get(tag) ?? 0) + 1)
}
return Array.from(counts, ([tag, count]) => ({ tag, count })).sort(
  (a, b) => b.count - a.count || a.tag.localeCompare(b.tag),
)`,
    labels: { A: 'products', B: 'extra' },
    A: [
      { name: 'Keyboard', tags: ['input', 'usb', 'wireless'] },
      { name: 'Mouse', tags: ['input', 'wireless'] },
      { name: 'Hub', tags: ['usb'] },
      { name: 'Headset', tags: ['audio', 'wireless'] },
      { name: 'Webcam', tags: ['usb', 'video'] },
    ],
    B: null,
    reference: (products) => {
      const counts = new Map<string, number>()
      for (const tag of products.flatMap((p) => p.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1)
      return Array.from(counts, ([tag, count]) => ({ tag, count })).sort(byCountThenName((item) => item.tag))
    },
  }),
  define({
    id: 'merge-cart-lines',
    title: 'Merge cart lines',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['map-collection', 'Array.from', 'spread-rest'],
    prompt: 'Combine cart rows with the same SKU into one row whose qty is the sum. Keep the price from the first row for that SKU, and keep SKUs in the order they first appear. The extra input is unused.',
    approach: 'Use a Map keyed by SKU: add a copy of the row the first time, otherwise add to its qty. A Map keeps insertion order.',
    solution: `const bySku = new Map<string, CartItem>()
for (const line of cart) {
  const existing = bySku.get(line.sku)
  if (existing) existing.qty += line.qty
  else bySku.set(line.sku, { ...line })
}
return Array.from(bySku.values())`,
    labels: { A: 'cart', B: 'extra' },
    A: [
      { sku: 'KB-01', qty: 1, price: 129 },
      { sku: 'MS-02', qty: 2, price: 49 },
      { sku: 'KB-01', qty: 2, price: 129 },
      { sku: 'HD-03', qty: 1, price: 79 },
      { sku: 'MS-02', qty: 1, price: 49 },
    ],
    B: null,
    reference: (cart) => {
      const bySku = new Map<string, (typeof cart)[number]>()
      for (const line of cart) {
        const existing = bySku.get(line.sku)
        if (existing) existing.qty += line.qty
        else bySku.set(line.sku, { ...line })
      }
      return Array.from(bySku.values())
    },
  }),
  define({
    id: 'index-users-by-email',
    title: 'Index users by normalized email',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['map-collection', 'object-from-entries', 'toLowerCase'],
    prompt: 'Build a lookup where the key is the lowercased email and the value is the whole user. When two users share an email, the later one wins. Return it as a plain object. The extra input is unused.',
    approach: 'Set each user into a Map under its lowercased email (later sets overwrite), then convert the Map to an object.',
    solution: `const byEmail = new Map<string, User>()
for (const user of users) byEmail.set(user.email.toLowerCase(), user)
return Object.fromEntries(byEmail)`,
    labels: { A: 'users', B: 'extra' },
    A: [
      { id: 1, name: 'Ada', email: 'Ada@acme.io' },
      { id: 2, name: 'Grace', email: 'grace@acme.io' },
      { id: 3, name: 'Ada L.', email: 'ada@ACME.io' },
      { id: 4, name: 'Linus', email: 'linus@globex.com' },
    ],
    B: null,
    reference: (users) => {
      const byEmail = new Map<string, (typeof users)[number]>()
      for (const user of users) byEmail.set(user.email.toLowerCase(), user)
      return Object.fromEntries(byEmail)
    },
  }),
  define({
    id: 'enrich-orders-from-index',
    title: 'Enrich orders from a product index',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['map-collection', 'map', 'reduce', 'destructuring'],
    prompt: 'Build a product lookup once, then return { lines, total }: lines are { sku, name, qty, subtotal } where subtotal = price × qty, and total is the sum of all subtotals. Every SKU exists in the catalog.',
    approach: 'Index the catalog by SKU in a Map, map each order line through it, then reduce the subtotals into a total.',
    solution: `const bySku = new Map(catalog.map((product) => [product.sku, product]))
const lines = orderLines.map(({ sku, qty }) => {
  const product = bySku.get(sku)!
  return { sku, name: product.name, qty, subtotal: product.price * qty }
})
return { lines, total: lines.reduce((sum, line) => sum + line.subtotal, 0) }`,
    labels: { A: 'orderLines', B: 'catalog' },
    A: [
      { sku: 'KB-01', qty: 2 },
      { sku: 'MN-04', qty: 1 },
      { sku: 'MS-02', qty: 3 },
    ],
    B: [
      { sku: 'KB-01', name: 'Mechanical Keyboard', price: 129 },
      { sku: 'MS-02', name: 'Wireless Mouse', price: 49 },
      { sku: 'HD-03', name: 'USB-C Hub', price: 79 },
      { sku: 'MN-04', name: '27" Monitor', price: 349 },
    ],
    reference: (orderLines, catalog) => {
      const bySku = new Map(catalog.map((p) => [p.sku, p]))
      const lines = orderLines.map(({ sku, qty }) => {
        const product = bySku.get(sku)!
        return { sku, name: product.name, qty, subtotal: product.price * qty }
      })
      return { lines, total: lines.reduce((sum, l) => sum + l.subtotal, 0) }
    },
  }),
  define({
    id: 'track-active-sessions',
    title: 'Track active sessions',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['set', 'for-of', 'spread-rest', 'sort'],
    prompt: 'Process login and logout events in order and return the ids of users who are still logged in, sorted alphabetically. Logging in twice counts once; logging out a user who is not logged in does nothing. The extra input is unused.',
    approach: 'Keep a Set of active users: add on login, delete on logout, then spread and sort it.',
    solution: `const active = new Set<string>()
for (const event of events) {
  if (event.type === 'login') active.add(event.userId)
  else active.delete(event.userId)
}
return [...active].sort()`,
    labels: { A: 'events', B: 'extra' },
    A: [
      { type: 'login', userId: 'carla' },
      { type: 'login', userId: 'ana' },
      { type: 'login', userId: 'bruno' },
      { type: 'logout', userId: 'carla' },
      { type: 'login', userId: 'ana' },
      { type: 'logout', userId: 'diego' },
      { type: 'login', userId: 'carla' },
      { type: 'logout', userId: 'bruno' },
    ],
    B: null,
    reference: (events) => {
      const active = new Set<string>()
      for (const e of events) {
        if (e.type === 'login') active.add(e.userId)
        else active.delete(e.userId)
      }
      return [...active].sort()
    },
  }),
  define({
    id: 'apply-permission-changes',
    title: 'Apply permission changes',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['set', 'for-of', 'spread-rest', 'sort'],
    prompt: 'Start from the current permissions, apply each grant or revoke event in order, and return the final permissions sorted alphabetically.',
    approach: 'Copy the permissions into a Set, add on grant, delete on revoke, then spread and sort.',
    solution: `const granted = new Set(permissions)
for (const change of changes) {
  if (change.type === 'grant') granted.add(change.permission)
  else granted.delete(change.permission)
}
return [...granted].sort()`,
    labels: { A: 'permissions', B: 'changes' },
    A: ['read', 'comment'],
    B: [
      { type: 'grant', permission: 'write' },
      { type: 'revoke', permission: 'comment' },
      { type: 'grant', permission: 'read' },
      { type: 'grant', permission: 'admin' },
      { type: 'revoke', permission: 'admin' },
      { type: 'grant', permission: 'deploy' },
    ],
    reference: (permissions, changes) => {
      const granted = new Set(permissions)
      for (const c of changes) {
        if (c.type === 'grant') granted.add(c.permission)
        else granted.delete(c.permission)
      }
      return [...granted].sort()
    },
  }),
  define({
    id: 'dedupe-customers-by-email',
    title: 'Deduplicate customers by email',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['set', 'filter', 'toLowerCase'],
    prompt: 'Keep only the first customer for each email address, comparing emails case-insensitively. Keep the original order. The extra input is unused.',
    approach: 'Remember lowercased emails in a Set; keep a customer only when its email has not been seen yet.',
    solution: `const seen = new Set<string>()
return customers.filter((customer) => {
  const email = customer.email.toLowerCase()
  if (seen.has(email)) return false
  seen.add(email)
  return true
})`,
    labels: { A: 'customers', B: 'extra' },
    A: [
      { id: 'c1', name: 'Ada', email: 'ada@acme.io' },
      { id: 'c2', name: 'Grace', email: 'Grace@Acme.io' },
      { id: 'c3', name: 'Ada Lovelace', email: 'ADA@acme.io' },
      { id: 'c4', name: 'Linus', email: 'linus@globex.com' },
      { id: 'c5', name: 'G. Hopper', email: 'grace@acme.io' },
    ],
    B: null,
    reference: (customers) => {
      const seen = new Set<string>()
      return customers.filter((c) => {
        const email = c.email.toLowerCase()
        if (seen.has(email)) return false
        seen.add(email)
        return true
      })
    },
  }),
  define({
    id: 'file-extension-frequency',
    title: 'File extension frequency',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['map-collection', 'object-from-entries', 'split', 'pop', 'toLowerCase'],
    prompt: 'Count files by extension (the text after the last ".", lowercased) and return an object such as { ts: 3, json: 2 }. Ignore files without a ".". The extra input is unused.',
    approach: 'Skip names without a dot, take the last split segment as the extension, tally it in a Map, then convert the Map to an object.',
    solution: `const counts = new Map<string, number>()
for (const name of files) {
  if (!name.includes('.')) continue
  const extension = name.split('.').pop()!.toLowerCase()
  counts.set(extension, (counts.get(extension) ?? 0) + 1)
}
return Object.fromEntries(counts)`,
    labels: { A: 'files', B: 'extra' },
    A: ['index.ts', 'README.md', 'package.json', 'utils.TS', 'tsconfig.json', 'app.test.ts', 'Makefile', 'logo.svg'],
    B: null,
    reference: (files) => {
      const counts = new Map<string, number>()
      for (const name of files) {
        if (!name.includes('.')) continue
        const ext = name.split('.').pop()!.toLowerCase()
        counts.set(ext, (counts.get(ext) ?? 0) + 1)
      }
      return Object.fromEntries(counts)
    },
  }),
  define({
    id: 'word-frequency-report',
    title: 'Word frequency report',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['map-collection', 'split', 'toLowerCase', 'Array.from', 'sort', 'slice'],
    prompt: 'Lowercase the sentences and split them into words (runs of letters a–z). Return the limit most frequent words as { word, count }[], sorted by count descending, then alphabetically.',
    approach: 'Split each lowercased sentence on non-letters, tally words in a Map, sort the entries by count then word, and keep the first limit.',
    solution: `const counts = new Map<string, number>()
for (const sentence of sentences) {
  for (const word of sentence.toLowerCase().split(/[^a-z]+/)) {
    if (word) counts.set(word, (counts.get(word) ?? 0) + 1)
  }
}
return Array.from(counts, ([word, count]) => ({ word, count }))
  .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
  .slice(0, limit)`,
    labels: { A: 'sentences', B: 'limit' },
    A: ['The map returns a new array.', 'Filter keeps items; map changes them.', 'A Set keeps unique items, and a Map keeps pairs.'],
    B: 4,
    reference: (sentences, limit) => {
      const counts = new Map<string, number>()
      for (const s of sentences) for (const w of s.toLowerCase().split(/[^a-z]+/)) if (w) counts.set(w, (counts.get(w) ?? 0) + 1)
      return Array.from(counts, ([word, count]) => ({ word, count })).sort(byCountThenName((item) => item.word)).slice(0, limit)
    },
  }),
  define({
    id: 'sanitize-configuration',
    title: 'Sanitize configuration',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['object-entries', 'filter', 'object-from-entries', 'includes', 'destructuring'],
    prompt: 'Return a copy of the config that keeps only supported keys, and drops any field whose value is null or undefined. Keep the original key order.',
    approach: 'Turn the config into entries, keep entries whose key is supported and whose value is not nullish, then rebuild the object.',
    solution: `return Object.fromEntries(
  Object.entries(config).filter(([key, value]) => supportedKeys.includes(key) && value != null),
)`,
    labels: { A: 'config', B: 'supportedKeys' },
    A: { port: 8080, host: 'localhost', debug: false, legacyMode: true, timeout: null, retries: 0, theme: null } as Record<string, unknown>,
    B: ['port', 'host', 'debug', 'timeout', 'retries'],
    reference: (config, supported) => Object.fromEntries(Object.entries(config).filter(([key, value]) => supported.includes(key) && value != null)),
  }),
  define({
    id: 'transform-feature-flags',
    title: 'Transform feature flags',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['object-entries', 'filter', 'map', 'destructuring'],
    prompt: 'Convert a flags object such as { darkMode: true, beta: false } into { enabled: [...], disabled: [...] } listing flag names in their original order. The extra input is unused.',
    approach: 'Read the flags as entries, then filter by value and map each pair to its name, once for each list.',
    solution: `const entries = Object.entries(flags)
return {
  enabled: entries.filter(([, on]) => on).map(([name]) => name),
  disabled: entries.filter(([, on]) => !on).map(([name]) => name),
}`,
    labels: { A: 'flags', B: 'extra' },
    A: { darkMode: true, beta: false, newCheckout: true, legacyNav: false, aiSearch: true } as Record<string, boolean>,
    B: null,
    reference: (flags) => {
      const entries = Object.entries(flags)
      return { enabled: entries.filter(([, on]) => on).map(([n]) => n), disabled: entries.filter(([, on]) => !on).map(([n]) => n) }
    },
  }),
  define({
    id: 'availability-calendar',
    title: 'Build availability calendar',
    difficulty: 'medium',
    path: 'mixed',
    concepts: ['Array.from', 'fill', 'for-of', 'indexed assignment'],
    prompt: 'Return an array of days booleans where true means available. Mark every booked day index as false. Ignore bookings outside the calendar so the array keeps exactly days items.',
    approach: 'Create days true values, then loop over the bookings and set in-range indexes to false.',
    solution: `const calendar = new Array<boolean>(days).fill(true)
for (const day of bookedDays) {
  if (day >= 0 && day < days) calendar[day] = false
}
return calendar`,
    labels: { A: 'bookedDays', B: 'days' },
    A: [2, 5, 6, 12, 0],
    B: 10,
    reference: (booked, days) => {
      const calendar = Array.from({ length: days }, () => true)
      for (const day of booked) if (day >= 0 && day < days) calendar[day] = false
      return calendar
    },
  }),
  define({
    id: 'top-products-per-category',
    title: 'Top products per category',
    difficulty: 'hard',
    path: 'mixed',
    concepts: ['map-collection', 'reduce', 'sort', 'slice', 'Array.from', 'destructuring'],
    prompt: 'Total sales per product within each category. Return [{ category, products }] with categories in order of first appearance, where products holds the top limit { product, total } items sorted by total descending, then by product name.',
    approach: 'Group totals in a Map of category → Map of product → total, then for each category sort its products, slice the top ones, and build the result.',
    solution: `const byCategory = sales.reduce((groups, { category, product, amount }) => {
  const totals = groups.get(category) ?? new Map<string, number>()
  totals.set(product, (totals.get(product) ?? 0) + amount)
  return groups.set(category, totals)
}, new Map<string, Map<string, number>>())
return Array.from(byCategory, ([category, totals]) => ({
  category,
  products: Array.from(totals, ([product, total]) => ({ product, total }))
    .sort((a, b) => b.total - a.total || a.product.localeCompare(b.product))
    .slice(0, limit),
}))`,
    labels: { A: 'sales', B: 'limit' },
    A: [
      { category: 'peripherals', product: 'Keyboard', amount: 129 },
      { category: 'displays', product: '27" Monitor', amount: 349 },
      { category: 'peripherals', product: 'Mouse', amount: 49 },
      { category: 'peripherals', product: 'Keyboard', amount: 129 },
      { category: 'peripherals', product: 'Webcam', amount: 89 },
      { category: 'peripherals', product: 'Headset', amount: 89 },
      { category: 'displays', product: 'Portable Monitor', amount: 199 },
      { category: 'peripherals', product: 'Mouse', amount: 49 },
      { category: 'displays', product: '27" Monitor', amount: 349 },
      { category: 'displays', product: 'Monitor Arm', amount: 59 },
      { category: 'displays', product: 'Webcam Mount', amount: 19 },
    ],
    B: 3,
    reference: (sales, limit) => {
      const byCategory = new Map<string, Map<string, number>>()
      for (const { category, product, amount } of sales) {
        const totals = byCategory.get(category) ?? new Map<string, number>()
        totals.set(product, (totals.get(product) ?? 0) + amount)
        byCategory.set(category, totals)
      }
      return Array.from(byCategory, ([category, totals]) => ({
        category,
        products: Array.from(totals, ([product, total]) => ({ product, total }))
          .sort((a, b) => b.total - a.total || a.product.localeCompare(b.product))
          .slice(0, limit),
      }))
    },
  }),
  define({
    id: 'resolve-undo-history',
    title: 'Resolve editor undo history',
    difficulty: 'hard',
    path: 'mixed',
    concepts: ['for-of', 'push', 'pop', 'splice', 'indexOf'],
    prompt:
      'Replay editor operations on the starting blocks and return the final block order. "add" appends a block. "remove" deletes a block if present (removing a missing block does nothing and cannot be undone). "undo" reverts the most recent add or remove that has not been undone: an undone add removes that block, an undone remove puts the block back at its old position. Undo with nothing to revert does nothing.',
    approach: 'Keep a history stack. Push { type, id, index } for each effective add or remove; on undo, pop the last entry and apply its inverse.',
    solution: `const document = [...initialBlocks]
const history: { type: 'add' | 'remove'; id: string; index: number }[] = []
for (const op of operations) {
  if (op.type === 'add') {
    document.push(op.id!)
    history.push({ type: 'add', id: op.id!, index: document.length - 1 })
  } else if (op.type === 'remove') {
    const index = document.indexOf(op.id!)
    if (index === -1) continue
    document.splice(index, 1)
    history.push({ type: 'remove', id: op.id!, index })
  } else {
    const last = history.pop()
    if (!last) continue
    if (last.type === 'add') document.splice(document.lastIndexOf(last.id), 1)
    else document.splice(last.index, 0, last.id)
  }
}
return document`,
    labels: { A: 'operations', B: 'initialBlocks' },
    A: [
      { type: 'add', id: 'image' },
      { type: 'remove', id: 'intro' },
      { type: 'add', id: 'quote' },
      { type: 'undo' },
      { type: 'remove', id: 'missing' },
      { type: 'undo' },
      { type: 'add', id: 'footer' },
      { type: 'remove', id: 'title' },
      { type: 'undo' },
      { type: 'undo' },
    ] as { type: 'add' | 'remove' | 'undo'; id?: string }[],
    B: ['title', 'intro', 'body'],
    reference: (operations, initialBlocks) => {
      const doc = [...initialBlocks]
      const history: { type: 'add' | 'remove'; id: string; index: number }[] = []
      for (const op of operations) {
        if (op.type === 'add') {
          doc.push(op.id!)
          history.push({ type: 'add', id: op.id!, index: doc.length - 1 })
        } else if (op.type === 'remove') {
          const index = doc.indexOf(op.id!)
          if (index === -1) continue
          doc.splice(index, 1)
          history.push({ type: 'remove', id: op.id!, index })
        } else {
          const last = history.pop()
          if (!last) continue
          if (last.type === 'add') doc.splice(doc.lastIndexOf(last.id), 1)
          else doc.splice(last.index, 0, last.id)
        }
      }
      return doc
    },
  }),
]
