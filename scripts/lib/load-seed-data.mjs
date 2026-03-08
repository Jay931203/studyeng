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

  const moduleShim = { exports: {} }
  const sandbox = {
    module: moduleShim,
    exports: moduleShim.exports,
    require,
    console,
  }

  vm.runInNewContext(transpiled, sandbox, { filename: seedPath })

  return {
    categories: moduleShim.exports.categories ?? [],
    seedVideos: moduleShim.exports.seedVideos ?? [],
    series: moduleShim.exports.series ?? [],
  }
}
