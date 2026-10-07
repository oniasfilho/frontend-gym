import { forPath } from './define'

const parts = forPath('string-parts', 'string → split → array of parts → (optional transformation) → join → string. split cuts a string at every separator; join glues parts back together, placing the separator between them.')
const normalize = forPath('string-normalization', 'Inconsistent string → normalize → canonical string. trim removes surrounding whitespace; toLowerCase and toUpperCase fix casing. Each returns a new string; the original never changes.')
const matching = forPath('string-matching', 'Ask where the text must appear. At the start → startsWith. At the end → endsWith. Anywhere → includes. Each answers with true or false.')

export const stringHelperLessons = [
  parts('string-parts-split-url-path', 'Split a URL path', 'Split the path at every "/" and return the parts. The leading "/" produces an empty first part; keep it.', '/api/users/42', null,
    (input) => input.split('/'), 'return input.split("/")'),
  parts('string-parts-split-full-names', 'Split full names', 'Return each full name split into its parts at the space, e.g. "Ada Lovelace" → ["Ada", "Lovelace"].', ['Ada Lovelace', 'Grace Hopper', 'Alan Turing'], null,
    (input) => input.map((name) => name.split(' ')), 'return input.map((name) => name.split(" "))', { support: ['map'] }),
  parts('string-parts-join-breadcrumb', 'Join breadcrumb labels', 'Join the labels into one breadcrumb string with " / " between them.', ['settings', 'security', 'password'], null,
    (input) => input.join(' / '), 'return input.join(" / ")'),
  parts('string-parts-reformat-csv', 'Reformat CSV rows', 'Each row separates its fields with ",". Return every row with its fields separated by " | " instead.', ['Ana,admin,active', 'Bruno,editor,inactive', 'Carla,viewer,active'], null,
    (input) => input.map((row) => row.split(',').join(' | ')), 'return input.map((row) => row.split(",").join(" | "))', { support: ['map'] }),
  parts('string-parts-path-breadcrumb', 'Build breadcrumb from path', 'Split the path at "/", drop the empty part the leading "/" creates, then join the parts with " > ".', '/products/keyboards/mechanical', null,
    (input) => input.split('/').filter(Boolean).join(' > '), 'return input\n  .split("/")\n  .filter(Boolean)\n  .join(" > ")', { support: ['filter'], difficulty: 'medium' }),

  normalize('string-normalization-lowercase-emails', 'Lowercase emails', 'Return every email in lowercase.', ['ANA@ACME.COM', 'Bruno@Example.com', 'CARLA@GLOBEX.IO'], null,
    (input) => input.map((email) => email.toLowerCase()), 'return input.map((email) => email.toLowerCase())', { support: ['map'] }),
  normalize('string-normalization-uppercase-countries', 'Uppercase country codes', 'Return every country code in uppercase.', ['br', 'us', 'de', 'pt'], null,
    (input) => input.map((code) => code.toUpperCase()), 'return input.map((code) => code.toUpperCase())', { support: ['map'] }),
  normalize('string-normalization-trim-form-values', 'Trim form values', 'Return every form value without the spaces around it.', ['  Ana', 'Bruno  ', '  Carla  '], null,
    (input) => input.map((value) => value.trim()), 'return input.map((value) => value.trim())', { support: ['map'] }),
  normalize('string-normalization-normalize-tags', 'Normalize tags', 'Return every tag trimmed and lowercased.', [' JavaScript ', 'TYPESCRIPT', ' React ', '  NODE.JS'], null,
    (input) => input.map((tag) => tag.trim().toLowerCase()), 'return input.map((tag) => tag.trim().toLowerCase())', { support: ['map'] }),
  normalize('string-normalization-user-records', 'Normalize user records', 'Return each user with the email trimmed and lowercased, and the country code uppercased.',
    [{ email: '  ANA@ACME.COM ', country: 'br' }, { email: 'Bob@Example.Com ', country: 'us' }, { email: ' carla@Globex.IO', country: 'Pt' }], null,
    (input) => input.map((user) => ({ email: user.email.trim().toLowerCase(), country: user.country.toUpperCase() })),
    'return input.map((user) => ({\n  email: user.email.trim().toLowerCase(),\n  country: user.country.toUpperCase(),\n}))', { support: ['map'], difficulty: 'medium' }),

  matching('string-matching-api-routes', 'Identify API routes', 'Return true for each path that starts with "/api/", otherwise false.', ['/api/users', '/products', '/api/orders'], null,
    (input) => input.map((path) => path.startsWith('/api/')), 'return input.map((path) => path.startsWith("/api/"))', { support: ['map'] }),
  matching('string-matching-company-emails', 'Identify company emails', 'Return true for each email that ends with "@acme.com", otherwise false.', ['ana@acme.com', 'bob@gmail.com', 'carla@acme.com'], null,
    (input) => input.map((email) => email.endsWith('@acme.com')), 'return input.map((email) => email.endsWith("@acme.com"))', { support: ['map'] }),
  matching('string-matching-search-filenames', 'Search filenames', 'Return the filenames that contain the search text in extra anywhere.', ['monthly-report.pdf', 'invoice.pdf', 'report-final.xlsx', 'avatar.png'], 'report',
    (input, extra) => input.filter((filename) => filename.includes(extra)), 'return input.filter((filename) => filename.includes(extra))', { support: ['filter'] }),
  matching('string-matching-image-files', 'Keep image files', 'Return only the filenames that end with ".png".', ['avatar.png', 'notes.txt', 'banner.png', 'data.json'], null,
    (input) => input.filter((filename) => filename.endsWith('.png')), 'return input.filter((filename) => filename.endsWith(".png"))', { support: ['filter'] }),
  matching('string-matching-classify-paths', 'Classify request paths', 'Return { path, type } for each path: type is "api" when it starts with "/api/", "admin" when it starts with "/admin/", otherwise "public".',
    ['/api/users', '/admin/settings', '/products', '/api/orders', '/admin/users'], null,
    (input) => input.map((path) => ({ path, type: path.startsWith('/api/') ? 'api' : path.startsWith('/admin/') ? 'admin' : 'public' })),
    'return input.map((path) => {\n  if (path.startsWith("/api/")) return { path, type: "api" }\n  if (path.startsWith("/admin/")) return { path, type: "admin" }\n  return { path, type: "public" }\n})', { support: ['map'], difficulty: 'medium' }),
]
