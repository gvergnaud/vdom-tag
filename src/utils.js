export const flatMap = (f, xs) => xs.reduce((acc, x) => acc.concat(f(x)), [])

export const escapeHTML = str =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

export const isEmpty = x =>
  x !== 0 && (!x || (typeof x === 'string' && !x.trim()))
