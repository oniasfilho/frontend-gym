import { forPath, users } from './define'

const optional = forPath('optional-chaining', 'Optional chaining stops when the value before ?. is null or undefined and returns undefined instead of throwing. It does not supply a fallback.')
const nullish = forPath('nullish-coalescing', 'The ?? operator uses the fallback only for null or undefined. Unlike ||, it preserves valid values such as 0, false, and the empty string.')

export const nullableLessons = [
  optional('optional-profile-name', 'Read an optional profile', 'Return profile.name if profile exists; otherwise return undefined. Do not add a fallback.', { profile: null } as { profile: { name: string } | null }, null,
    (input) => input.profile?.name, 'return input.profile?.name', { inputType: '{ profile: { name: string } | null }' }),
  optional('optional-array-element', 'Read an optional array element', 'Return the name at the zero-based index in extra, or undefined when that element does not exist.', [{ name: 'Ana' }, { name: 'Bruno' }, { name: 'Carla' }], 5,
    (input, extra) => input[extra]?.name, 'return input[extra]?.name'),
  optional('optional-two-levels', 'Two nullable levels', 'Return profile.address.city safely. Both profile and address can be null; return undefined if either is absent.', { profile: { address: null } } as { profile: { address: { city: string } | null } | null }, null,
    (input) => input.profile?.address?.city, 'return input.profile?.address?.city', { inputType: '{ profile: { address: { city: string } | null } | null }' }),
  optional('optional-call-function', 'Call an optional function', 'The starter prepares an optional notify function: it returns input when extra is true, otherwise it is undefined. Call notify using optional chaining and return its result.', 'Hello, Ana', false,
    (input, extra) => { const notify = extra ? () => input : undefined; return notify?.() }, 'return notify?.()', { setup: 'const notify = extra ? () => input : undefined' }),
  optional('optional-after-lookup', 'Read after a lookup', 'Find the user with the ID in extra and safely return the name. A missing user must yield undefined, with no fallback.', users, 9,
    (input, extra) => input.find((user) => user.id === extra)?.name, 'return input.find((user) => user.id === extra)?.name', { support: ['find'], difficulty: 'medium' }),

  nullish('nullish-undefined-fallback', 'Fallback for undefined', 'Return input.value unless it is null or undefined; otherwise return extra.', { value: undefined } as { value?: string | null }, 'Guest',
    (input, extra) => input.value ?? extra, 'return input.value ?? extra', { inputType: '{ value?: string | null }' }),
  nullish('nullish-null-fallback', 'Fallback for null', 'Return input.value unless it is null or undefined; otherwise return extra.', { value: null } as { value: string | null }, 'Untitled',
    (input, extra) => input.value ?? extra, 'return input.value ?? extra', { inputType: '{ value: string | null }' }),
  nullish('nullish-preserve-zero', 'Preserve zero', 'Return input.value with extra as the nullish fallback. Zero is a valid value and must remain 0, not become 10.', { value: 0 } as { value: number | null }, 10,
    (input, extra) => input.value ?? extra, 'return input.value ?? extra', { inputType: '{ value: number | null }' }),
  nullish('nullish-preserve-false', 'Preserve false', 'Return input.value with extra as the nullish fallback. false is a valid value and must remain false, not become true.', { value: false } as { value: boolean | null }, true,
    (input, extra) => input.value ?? extra, 'return input.value ?? extra', { inputType: '{ value: boolean | null }' }),
  nullish('nullish-optional-fallback', 'Optional access with a fallback', 'Safely return profile.name, or the fallback in extra if the name is null or undefined. Preserve an empty name as an empty string.', { profile: null } as { profile: { name?: string | null } | null }, 'Guest',
    (input, extra) => input.profile?.name ?? extra, 'return input.profile?.name ?? extra', { support: ['optional-chaining'], inputType: '{ profile: { name?: string | null } | null }', difficulty: 'medium' }),
]
