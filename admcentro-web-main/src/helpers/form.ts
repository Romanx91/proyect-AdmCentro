import { validateMail } from './general'

export const validateForm = (data: Object, notAllowedKeys: string[] = []): { ok: boolean; error: Object } => {
  let error: any = {}
  let ok = true
  notAllowedKeys.concat(['updatedAt', 'deletedAt', 'id', 'createdAt']).forEach((key: string) => {
    // @ts-expect-error
    delete data[key]
  })

  Object.entries(data).forEach(([key, value]) => {
    switch (typeof value) {
      case 'string':
        if (!value.trim().length) {
          error[key] = true
          ok = false
        }
        break
      case 'number':
        if (value === undefined || value === null || Number.isNaN(value)) {
          error[key] = true
          ok = false
        }

        break
      case 'boolean':
        if (!value) {
          error[key] = true
          ok = false
        }
        break
      case 'object':
        if (!value) {
          error[key] = true
          ok = false
        }
        break
      default:
        error[key] = true
        ok = false
        break
    }

    if (key === 'email' && !validateMail(value)) {
      error[key] = true
      ok = false
    }
  })
  return { error, ok }
}
