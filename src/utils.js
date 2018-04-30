export const flatMap = (f, xs) => xs.reduce((acc, x) => acc.concat(f(x)), [])

export const isEmpty = x =>
  x !== 0 && (!x || (typeof x === 'string' && !x.trim()))
