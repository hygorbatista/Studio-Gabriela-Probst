import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
export function loadSource(entry, overrides = {}) {
  const modules = new Map()
  function load(file) {
    const resolved = path.resolve(file)
    if (modules.has(resolved)) return modules.get(resolved)
    const source = fs.readFileSync(resolved, 'utf8')
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
    })
    const mod = { exports: {} }
    new Function('exports', 'require', outputText)(mod.exports, (name) => {
      if (name in overrides) return overrides[name]
      if (name === 'server-only') return {}
      if (name.startsWith('@/') || name.startsWith('.')) {
        const base = name.startsWith('@/') ? path.resolve(name.slice(2)) : path.resolve(path.dirname(resolved), name)
        return load(fs.existsSync(base + '.ts') ? base + '.ts' : base + '.tsx')
      }
      return require(name)
    })
    modules.set(resolved, mod.exports)
    return mod.exports
  }
  return load(entry)
}
