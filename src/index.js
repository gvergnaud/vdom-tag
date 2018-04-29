import { flatMap, escapeHTML, isEmpty } from './utils'

const unionType = (() => {
  let i = 0
  return types => types.reduce((acc, type) => ({ ...acc, [type]: i++ }), {})
})()

export const State = unionType([
  'Text',
  'Tag',
  'ClosingTag',
  'Attr',
  'AttrKey',
  'AttrValue',
  'AttrValueSingleQuote',
  'AttrValueDoubleQuote'
])

export const Token = unionType([
  'Text',
  'OpenTag',
  'AttributeName',
  'AttributeValue',
  'CloseTag',
  'SelfCloseTag',
  'ClosingTag',
  'VTree'
])

export const Tree = unionType(['Node', 'VTree', 'Text'])

export function tokenizer(str, initialState = State.Text, initialAcc = '') {
  let tokens = []
  let state = initialState
  let acc = initialAcc

  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    switch (state) {
      case State.Text:
        if (c === '<') {
          if (!isEmpty(acc)) {
            tokens.push({ type: Token.Text, value: escapeHTML(acc) })
          }
          acc = ''
          state = State.Tag
        } else {
          acc += c
        }
        continue

      case State.Tag:
        if (/\s/.test(c)) {
          tokens.push({ type: Token.OpenTag, value: acc })
          acc = ''
          state = State.Attr
        } else if (c === '>') {
          tokens.push({ type: Token.OpenTag, value: acc })
          tokens.push({ type: Token.CloseTag })
          acc = ''
          state = State.Text
        } else if (c === '/' && acc === '') {
          state = State.ClosingTag
        } else {
          acc += c
        }
        continue

      case State.ClosingTag:
        if (c === '>') {
          tokens.push({ type: Token.ClosingTag, value: acc })
          acc = ''
          state = State.Text
        } else {
          acc += c
        }
        continue

      case State.Attr:
        if (c === '>') {
          if (acc === '/') tokens.push({ type: Token.SelfCloseTag })
          else tokens.push({ type: Token.CloseTag })
          acc = ''
          state = State.Text
        } else if (/\s/.test(c)) {
        } else if (c === '/') {
          acc += c
        } else {
          acc += c
          state = State.AttrKey
        }
        continue

      case State.AttrKey:
        if (c === '=') {
          // The attr name could be dynamic, so it would be in a previous fragment
          if (acc !== '') tokens.push({ type: Token.AttributeName, value: acc })
          acc = ''
          state = State.AttrValue
        } else if (/\s/.test(c)) {
          if (acc !== '') tokens.push({ type: Token.AttributeName, value: acc })
          acc = ''
          state = State.Attr
        } else {
          acc += c
        }
        continue

      case State.AttrValue:
        if (/\s/.test(c)) {
          tokens.push({ type: Token.AttributeValue, value: acc })
          acc = ''
          state = State.Attr
        } else if (c === '>') {
          tokens.push({ type: Token.AttributeValue, value: acc })
          tokens.push({ type: Token.CloseTag })
          acc = ''
          state = State.Text
        } else if (acc === '' && c === "'") {
          state = State.AttrValueSingleQuote
        } else if (acc === '' && c === '"') {
          state = State.AttrValueDoubleQuote
        } else {
          acc += c
        }
        continue

      case State.AttrValueSingleQuote:
        if (c === "'") {
          tokens.push({ type: Token.AttributeValue, value: acc })
          acc = ''
          state = State.Attr
        } else {
          acc += c
        }
        continue

      case State.AttrValueDoubleQuote:
        if (c === '"') {
          tokens.push({ type: Token.AttributeValue, value: acc })
          acc = ''
          state = State.Attr
        } else {
          acc += c
        }
        continue
    }
  }

  return [tokens, state, acc]
}

const parseObjectAttrs = obj => [
  flatMap(
    ([name, value]) =>
      !name.trim()
        ? []
        : [
            { type: Token.AttributeName, value: name },
            { type: Token.AttributeValue, value }
          ],
    Object.entries(obj)
  ),
  State.Attr
]

const parseStringAttrs = str =>
  str
    .split(/\s+/)
    .filter(attr => attr.trim())
    .reduce(
      ([tokens], attr) => {
        const [name, value] = attr.split('=')

        if (value) {
          return [
            tokens.concat([
              { type: Token.AttributeName, value: name },
              { type: Token.AttributeValue, value }
            ]),
            State.Attr
          ]
        }

        return [
          tokens.concat([{ type: Token.AttributeName, value: name }]),
          State.AttrKey
        ]
      },
      [[], State.Attr]
    )

export function variableTokenizer(
  variable,
  initialState = Token.Text,
  initialAcc = ''
) {
  if (variable === undefined) return [[], initialState, initialAcc]

  let tokens = []
  let state = initialState
  let acc = initialAcc

  switch (state) {
    case State.Text:
      if (typeof variable === 'object') {
        if (!isEmpty(acc)) {
          tokens.push({ type: Token.Text, value: escapeHTML(acc) })
        }

        tokens.push({ type: Token.VTree, value: variable })

        acc = ''
      } else {
        if (!isEmpty(acc)) {
          tokens.push({ type: Token.Text, value: escapeHTML(acc) })
        }

        if (!isEmpty(variable)) {
          tokens.push({
            type: Token.Text,
            value: escapeHTML(variable.toString())
          })
        }

        acc = ''
      }
      break

    case State.Tag:
      if (acc !== '') {
        acc += variable
      } else {
        acc = variable
      }
      break

    case State.ClosingTag:
      if (acc !== '') {
        acc += variable
      } else {
        acc = variable
      }
      break

    case State.Attr:
      if (typeof variable === 'object') {
        [tokens, state] = parseObjectAttrs(variable)
      } else if (typeof variable === 'string') {
        [tokens, state] = parseStringAttrs(variable)
      } else {
        throw new Error(
          `Variable ${variable} of type '${typeof variable}' is not supported in the State.Attr context`
        )
      }
      break

    case State.AttrKey:
      throw new Error(
        `Variable ${variable} of type '${typeof variable}' is not supported in the State.AttrKey context`
      )

    case State.AttrValue:
      if (acc !== '') {
        acc += variable
      } else {
        acc = variable
      }
      break

    case State.AttrValueSingleQuote:
      if (acc !== '') {
        acc += variable
      } else {
        acc = variable
      }
      break

    case State.AttrValueDoubleQuote:
      if (acc !== '') {
        acc += variable
      } else {
        acc = variable
      }
      break
  }

  return [tokens, state, acc]
}

export const tokenizerTag = (strings, ...variables) => {
  let tokens = []
  let state = State.Text
  let acc = ''

  for (let i = 0; i < strings.length; i++) {
    const string = strings[i]
    const variable = variables[i]
    const [stringTokens, stringState, stringAcc] = tokenizer(string, state, acc)
    const [variableTokens, variableState, variableAcc] = variableTokenizer(
      variable,
      stringState,
      stringAcc
    )

    tokens = tokens.concat(stringTokens).concat(variableTokens)
    state = variableState
    acc = variableAcc
  }

  return tokens
}

const NAME_INDEX = 0
const ATTR_INDEX = 1
const CHILDREN_INDEX = 2

const applyH = (h, treeParts) =>
  treeParts.map(treePart => {
    switch (treePart.type) {
      case Tree.Node:
        return h(
          treePart.value[NAME_INDEX],
          treePart.value[ATTR_INDEX],
          applyH(h, treePart.value[CHILDREN_INDEX])
        )
      case Tree.VTree:
      case Tree.Text:
        return treePart.value
    }
  })

// buildTree
//  :: [Token]
//  -> Int
//  -> [[Tree], Int]
export function buildTree(tokens, initialIndex = 0) {
  let treeParts = []
  let i = initialIndex

  while (i < tokens.length) {
    const token = tokens[i]
    const lastTreePart = treeParts[treeParts.length - 1]
    const currentNode =
      lastTreePart && lastTreePart.type === Tree.Node
        ? lastTreePart.value
        : null

    switch (token.type) {
      case Token.OpenTag:
        treeParts.push({ type: Tree.Node, value: [token.value, {}, []] })
        i++
        break

      case Token.Text:
        treeParts.push({ type: Tree.Text, value: token.value })
        i++
        break

      case Token.VTree:
        treeParts.push(
          ...(!Array.isArray(token.value)
            ? [{ type: Tree.VTree, value: token.value }]
            : token.value.map(value => ({ type: Tree.VTree, value })))
        )
        i++
        break

      case Token.AttributeName:
        if (currentNode) {
          if (tokens[i + 1] && tokens[i + 1].type === Token.AttributeValue) {
            currentNode[ATTR_INDEX][token.value] = tokens[i + 1].value
            i += 2
          } else {
            currentNode[ATTR_INDEX][token.value] = true
            i++
          }
        } else {
          i++
        }
        break

      case Token.AttributeValue:
        // Nothing, can't happen since it's always following a Token.AttributeName
        // which handle this case.
        break

      case Token.CloseTag: // eslint-disable-line
        if (currentNode) {
          let [children, nextIndex] = buildTree(tokens, i + 1)
          currentNode[CHILDREN_INDEX] = children
          i = nextIndex
        } else {
          i++
        }
        break

      case Token.SelfCloseTag:
        i++
        break

      case Token.ClosingTag:
        return [treeParts, i + 1]
    }
  }

  return [treeParts, i]
}

const unwrapIfOnlyValue = xs => (xs.length === 1 ? xs[0] : xs)

export default function createParser(h) {
  return (...args) => {
    const [tree] = buildTree(tokenizerTag(...args))
    return unwrapIfOnlyValue(applyH(h, tree))
  }
}
