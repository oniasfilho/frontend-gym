export async function formatCode(source: string): Promise<string> {
  const [{ format }, { default: typescript }, { default: estree }] = await Promise.all([
    import('prettier/standalone'),
    import('prettier/plugins/typescript'),
    import('prettier/plugins/estree'),
  ])

  return format(source, {
    parser: 'typescript',
    plugins: [typescript, estree],
    printWidth: 80,
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'all',
  })
}
