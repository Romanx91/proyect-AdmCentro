export const formatDate = (date: string | Date) => {
  let now = new Date(date)
  now.setHours(now.getHours() - 3)
  return (
    now.getUTCDate().toString().padStart(2, '0') +
    '-' +
    (now.getUTCMonth() + 1).toString().padStart(2, '0') +
    '-' +
    now.getUTCFullYear().toString() +
    ' ' +
    now.getUTCHours().toString().padStart(2, '0') +
    ':' +
    now.getUTCMinutes().toString().padStart(2, '0')
  )
}

export const formatDateForInput = (date: string) => {
  let now = new Date(date)
  now.setHours(now.getHours() - 3)
  return (
    now.getUTCFullYear().toString() +
    '-' +
    (now.getUTCMonth() + 1).toString().padStart(2, '0') +
    '-' +
    now.getUTCDate().toString().padStart(2, '0') +
    ' ' +
    now.getUTCHours().toString().padStart(2, '0') +
    ':' +
    now.getUTCMinutes().toString().padStart(2, '0')
  )
}

export function padTo2Digits(num: number) {
  return num.toString().padStart(2, '0')
}
export function padToNDigit(num: number, n: number) {
  return num.toString().padStart(n, '0')
}

export function formatDateDDMMYYYY(date: string) {
  let d = new Date(date)
  return [padTo2Digits(d.getUTCDate()), padTo2Digits(d.getUTCMonth() + 1), d.getUTCFullYear()].join('-')
}

export const diffenceBetweenDates = (date1: string, date2: string): number => {
  let now = new Date(date1)
  let now2 = new Date(date2)
  let diff = now2.getTime() - now.getTime()
  let diffDays = Math.ceil(diff / (1000 * 3600 * 24))
  return diffDays
}
export const dateOneIsBiggerThanDateTwo = (date1: string, date2: string): boolean => {
  let now = new Date(date1)
  let now2 = new Date(date2)
  return now.getTime() > now2.getTime()
}

export const diferenceBetweentwoDatesInYears = (date1: string, date2: string): number => {
  let now = new Date(date1)
  let now2 = new Date(date2)
  let diff = now2.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 3600 * 24 * 365.25))
}

type T = 'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'

export const addDate = (date: string, quantity: number, type: T): Date => {
  let now = new Date(date)
  switch (type) {
    case 'years':
      now.setFullYear(now.getFullYear() + quantity)
      break
    case 'months':
      now.setMonth(now.getMonth() + quantity)
      break
    case 'days':
      now.setDate(now.getDate() + quantity)
      break
    case 'hours':
      now.setHours(now.getHours() + quantity)
      break
    case 'minutes':
      now.setMinutes(now.getMinutes() + quantity)
      break
    case 'seconds':
      now.setSeconds(now.getSeconds() + quantity)
      break
    case 'milliseconds':
      now.setMilliseconds(now.getMilliseconds() + quantity)
      break
    default:
      break
  }
  return now
}
