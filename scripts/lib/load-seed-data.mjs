import { readFile } from 'fs/promises'
import { createRequire } from 'module'
import vm from 'vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)

export async function loadSeedData(seedPath) {
  const source = await readFile(seedPath, 'utf-8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: seedPath,
  }).outputText

  const module = { exports: {} }
  const sandbox = {
    module,
    exports: module.exports,
    require,
    console,
  }

  vm.runInNewContext(transpiled, sandbox, { filename: seedPath })

  return {
    categories: module.exports.categories ?? [],
    seedVideos: module.exports.seedVideos ?? [],
    series: module.exports.series ?? [],
  }
}
