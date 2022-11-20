import { pathToFileURL } from "node:url"
import path from "node:path"

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("/")) specifier = pathToFileURL(path.resolve(path.join("src", specifier)))
  return {
    url: (await next(specifier, context)).url
  }
}