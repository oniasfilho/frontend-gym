import { define, type Difficulty, type PathSlug } from '@/lib/exercise-model'
import { formatShape } from '@/lib/shape'

type Options = {
  support?: PathSlug[]
  difficulty?: Difficulty
  approach?: string
  stage?: string
  setup?: string
  inputType?: string
}

export function forPath(path: Exclude<PathSlug, 'mixed'>, mentalModel: string) {
  return function lesson<A, B>(id: string, title: string, prompt: string, input: A, extra: B, reference: (input: A, extra: B) => unknown, solution: string, options: Options = {}) {
    const exercise = define({
      id, title, path,
      concepts: [path, ...(options.support ?? [])],
      difficulty: options.difficulty ?? 'easy',
      prompt: `${prompt}${extra === null ? ' The extra input is unused.' : ''}`,
      approach: options.approach ?? mentalModel,
      stage: options.stage,
      A: input, B: extra,
      labels: { A: 'input', B: 'extra' },
      reference,
      solution: options.setup ? `${options.setup}\n${solution}` : solution,
    })
    if (options.inputType) {
      exercise.starter = `function solve(input: ${options.inputType}, extra: ${formatShape(exercise.params[1].shape)}) {\n  \n}\n`
      exercise.declarations = ''
    }
    if (options.setup) exercise.starter = exercise.starter.replace('  \n}', `  ${options.setup}\n  \n}`)
    return exercise
  }
}

export const users = [
  { id: 1, name: 'Ana', active: true, age: 24 },
  { id: 2, name: 'Bruno', active: false, age: 17 },
  { id: 3, name: 'Carla', active: true, age: 32 },
]
export const products = [
  { sku: 'K1', name: 'Keyboard', price: 100, stock: 3 },
  { sku: 'M1', name: 'Mouse', price: 50, stock: 0 },
  { sku: 'C1', name: 'Cable', price: 20, stock: 5 },
]
