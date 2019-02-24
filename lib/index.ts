import 'source-map-support/register'
import { InternalRefRewriter } from './refs'
import { compileSchema } from './compile'
import { Operation } from './operation'
import { RequestTypeFormatter, ResultTypeFormatter } from './formatters'

type StringStore = { [key:string]:string }

export const GenerateTypings = async (parsedOpenAPISchema:OpenAPISchema, {
  formatters = [
    RequestTypeFormatter,
    ResultTypeFormatter,
  ]
}: any = {}):Promise<string> => {
  const { paths, components: { schemas }} = parsedOpenAPISchema
  const typeStore:StringStore = {}

  new InternalRefRewriter().rewrite(parsedOpenAPISchema.components.schemas)
  new InternalRefRewriter().rewrite(parsedOpenAPISchema.paths)

  for (const schemaName of Object.keys(schemas)) {
    typeStore[schemaName] = await compileSchema(schemas[schemaName], schemaName)
  }

  for (const pathName of Object.keys(paths)) {
    for (const method of Object.keys(paths[pathName])) {
      const operation = new Operation(paths[pathName][method], { pathName, method })
      for (const Formatter of formatters) {
        Object.assign(typeStore, await new Formatter(operation).render())
      }
    }
  }

  return Object.values(typeStore).filter(t => t).join('\n')
}