import { describeInputs, type Param } from '@/lib/shape'

export type PathSlug = 'for-of' | 'map' | 'filter' | 'find' | 'some' | 'every' | 'reduce' | 'flatmap' | 'sort' | 'string-parts' | 'string-normalization' | 'string-matching' | 'array-position' | 'array-extraction' | 'destructuring' | 'spread-rest' | 'set' | 'map-collection' | 'object-entries' | 'object-from-entries' | 'optional-chaining' | 'nullish-coalescing' | 'sliding-window' | 'mixed'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Exercise = {
  id: string
  title: string
  path: PathSlug
  concepts: string[]
  difficulty: Difficulty
  prompt: string
  approach: string
  solution: string
  stage?: string
  labels: { A: string; B: string }
  A: unknown
  B: unknown
  expected: unknown
  starter: string
  declarations: string
  params: [Param, Param]
  reference: (a: unknown, b: unknown) => unknown
}

type ExerciseDefinition<TA, TB> = Omit<Exercise, 'expected' | 'starter' | 'declarations' | 'A' | 'B' | 'params' | 'reference'> & {
  A: TA
  B: TB
  reference: (A: TA, B: TB) => unknown
}

export function define<TA, TB>({ reference, ...rest }: ExerciseDefinition<TA, TB>): Exercise {
  const described = describeInputs(rest.labels.A, rest.A, rest.labels.B, rest.B)
  return {
    ...rest,
    params: described.params,
    reference: (a, b) => reference(a as TA, b as TB),
    expected: reference(structuredClone(rest.A), structuredClone(rest.B)),
    starter: described.starter,
    declarations: described.declarations,
  }
}
