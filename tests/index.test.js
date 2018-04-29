import createParser, {
  buildTree,
  tokenizer,
  variableTokenizer,
  tokenizerTag,
  Token,
  State,
  Tree
} from '../src'

const h = (name, attrs, children) => ({ name, attrs, children })
const html = createParser(h)

describe('tokenizer', () => {
  it('should parse attrs', () => {
    expect(tokenizer('<div class="cool">', State.Text)).toEqual([
      [
        { type: Token.OpenTag, value: 'div' },
        { type: Token.AttributeName, value: 'class' },
        { type: Token.AttributeValue, value: 'cool' },
        { type: Token.CloseTag }
      ],
      State.Text,
      ''
    ])
  })

  it('should parse attributes without values', () => {
    expect(tokenizer(' autofocus ', State.Attr)).toEqual([
      [{ type: Token.AttributeName, value: 'autofocus' }],
      State.Attr,
      ''
    ])
  })

  it('should parse attributes without quotes', () => {
    expect(tokenizer(`<p class=yes>`, State.Text)).toEqual([
      [
        { type: Token.OpenTag, value: 'p' },
        { type: Token.AttributeName, value: 'class' },
        { type: Token.AttributeValue, value: 'yes' },
        { type: Token.CloseTag }
      ],
      State.Text,
      ''
    ])
  })

  it('should parse selfclosing tags', () => {
    expect(tokenizer(' />', State.Attr)).toEqual([
      [{ type: Token.SelfCloseTag }],
      State.Text,
      ''
    ])
  })

  it('should parse text', () => {
    expect(tokenizer('<p>hello hello hello</p>', State.Text)).toEqual([
      [
        { type: Token.OpenTag, value: 'p' },
        { type: Token.CloseTag },
        { type: Token.Text, value: 'hello hello hello' },
        { type: Token.ClosingTag, value: 'p' }
      ],
      State.Text,
      ''
    ])
  })

  it('should work', () => {
    expect(
      tokenizer(
        '<div class="cool"><input autofocus value="yes" /></div>',
        State.Text
      )
    ).toEqual([
      [
        { type: Token.OpenTag, value: 'div' },
        { type: Token.AttributeName, value: 'class' },
        { type: Token.AttributeValue, value: 'cool' },
        { type: Token.CloseTag },
        { type: Token.OpenTag, value: 'input' },
        { type: Token.AttributeName, value: 'autofocus' },
        { type: Token.AttributeName, value: 'value' },
        { type: Token.AttributeValue, value: 'yes' },
        { type: Token.SelfCloseTag },
        { type: Token.ClosingTag, value: 'div' }
      ],
      State.Text,
      ''
    ])
  })
})

describe('variableTokenizer', () => {
  it('should understand object as attributes', () => {
    expect(
      variableTokenizer({ class: 'cool', autofocus: true }, State.Attr)
    ).toEqual([
      [
        { type: Token.AttributeName, value: 'class' },
        { type: Token.AttributeValue, value: 'cool' },
        { type: Token.AttributeName, value: 'autofocus' },
        { type: Token.AttributeValue, value: true }
      ],
      State.Attr,
      ''
    ])
  })
})

describe('tokenizerTag', () => {
  it('should successfully parse dynamic attr values', () => {
    expect(tokenizerTag`<div class="${'cool'}">`).toEqual([
      { type: Token.OpenTag, value: 'div' },
      { type: Token.AttributeName, value: 'class' },
      { type: Token.AttributeValue, value: 'cool' },
      { type: Token.CloseTag }
    ])

    expect(tokenizerTag`<Custom list="${[1, 2, 3]}">`).toEqual([
      { type: Token.OpenTag, value: 'Custom' },
      { type: Token.AttributeName, value: 'list' },
      { type: Token.AttributeValue, value: [1, 2, 3] },
      { type: Token.CloseTag }
    ])
  })

  it('should successfully parse dynamic tag names', () => {
    expect(tokenizerTag`<${'input'} />`).toEqual([
      { type: Token.OpenTag, value: 'input' },
      { type: Token.SelfCloseTag }
    ])

    const Custom = () => {}
    expect(tokenizerTag`<${Custom} />`).toEqual([
      { type: Token.OpenTag, value: Custom },
      { type: Token.SelfCloseTag }
    ])
  })

  it('should be able to parse dynamic attr names', () => {
    expect(tokenizerTag`<input type="checkbox" ${'checked'}="yes" />`).toEqual([
      { type: Token.OpenTag, value: 'input' },
      { type: Token.AttributeName, value: 'type' },
      { type: Token.AttributeValue, value: 'checkbox' },
      { type: Token.AttributeName, value: 'checked' },
      { type: Token.AttributeValue, value: 'yes' },
      { type: Token.SelfCloseTag }
    ])
  })

  it('should be able to parse dynamic attr values without quotes', () => {
    expect(tokenizerTag`<div class=${'yo'}>`).toEqual([
      { type: Token.OpenTag, value: 'div' },
      { type: Token.AttributeName, value: 'class' },
      { type: Token.AttributeValue, value: 'yo' },
      { type: Token.CloseTag }
    ])

    expect(tokenizerTag`<input type=${'checkbox'} />`).toEqual([
      { type: Token.OpenTag, value: 'input' },
      { type: Token.AttributeName, value: 'type' },
      { type: Token.AttributeValue, value: 'checkbox' },
      { type: Token.SelfCloseTag }
    ])
  })

  it('should work', () => {
    expect(
      tokenizerTag`
          <div class="${'cool'}">
            <${'input'} autofocus ${'value'}="yes" />
            Cool
          </div>
      `
    ).toEqual([
      { type: Token.OpenTag, value: 'div' },
      { type: Token.AttributeName, value: 'class' },
      { type: Token.AttributeValue, value: 'cool' },
      { type: Token.CloseTag },
      { type: Token.OpenTag, value: 'input' },
      { type: Token.AttributeName, value: 'autofocus' },
      { type: Token.AttributeName, value: 'value' },
      { type: Token.AttributeValue, value: 'yes' },
      { type: Token.SelfCloseTag },
      { type: Token.Text, value: '\n            Cool\n          ' },
      { type: Token.ClosingTag, value: 'div' }
    ])
  })
})

describe('buildTree', () => {
  it('should transform tokens into a virtalDOM tree', () => {
    expect(
      buildTree([
        { type: Token.OpenTag, value: 'div' },
        { type: Token.AttributeName, value: 'class' },
        { type: Token.AttributeValue, value: 'cool' },
        { type: Token.CloseTag },
        { type: Token.OpenTag, value: 'input' },
        { type: Token.AttributeName, value: 'autofocus' },
        { type: Token.AttributeName, value: 'value' },
        { type: Token.AttributeValue, value: 'yes' },
        { type: Token.SelfCloseTag },
        { type: Token.Text, value: 'Cool' },
        { type: Token.OpenTag, value: 'div' },
        { type: Token.CloseTag },
        { type: Token.OpenTag, value: 'p' },
        { type: Token.CloseTag },
        { type: Token.Text, value: 'coucou' },
        { type: Token.ClosingTag, value: 'p' },
        { type: Token.OpenTag, value: 'p' },
        { type: Token.CloseTag },
        { type: Token.Text, value: 'pouet' },
        { type: Token.ClosingTag, value: 'p' },
        { type: Token.ClosingTag, value: 'div' },
        { type: Token.ClosingTag, value: 'div' }
      ])
    ).toEqual([
      [
        {
          type: Tree.Node,
          value: [
            'div',
            { class: 'cool' },
            [
              {
                type: Tree.Node,
                value: ['input', { autofocus: true, value: 'yes' }, []]
              },
              { type: Tree.Text, value: 'Cool' },
              {
                type: Tree.Node,
                value: [
                  'div',
                  {},
                  [
                    {
                      type: Tree.Node,
                      value: ['p', {}, [{ type: Tree.Text, value: 'coucou' }]]
                    },
                    {
                      type: Tree.Node,
                      value: ['p', {}, [{ type: Tree.Text, value: 'pouet' }]]
                    }
                  ]
                ]
              }
            ]
          ]
        }
      ],
      22
    ])
  })
})

describe('createParser', () => {
  it('should successfully parse complexe dom', () => {
    expect(html`
      <div class="${'cool'}">
        <${'input'} autofocus ${'value'}="yes" />
        <div>
          Cool
          <p>Hello</p>
          <p>Can you dig it</p>
        </div>
      </div>
    `).toEqual(
      h('div', { class: 'cool' }, [
        h('input', { autofocus: true, value: 'yes' }, []),
        h('div', {}, [
          '\n          Cool\n          ',
          h('p', {}, ['Hello']),
          h('p', {}, ['Can you dig it'])
        ])
      ])
    )
  })

  it('should succefully parse nested calls of html', () => {
    expect(html`
        <div>
          ${html`<p>coucou</p>`}
        </div>
      `).toEqual(h('div', {}, [h('p', {}, ['coucou'])]))
  })

  it('should succefully parse nested calls of html surrounded by text', () => {
    expect(html`
        <div>oh ${html`<p>coucou</p>`} yeah!</div>
      `).toEqual(h('div', {}, ['oh ', h('p', {}, ['coucou']), ' yeah!']))
  })

  it('should ignore empty variables', () => {
    expect(html`
      <div ${''} />
    `).toEqual(h('div', {}, []))
  })

  it('should succefully parse lists of html', () => {
    expect(html`
      <div>
        ${[1, 2, 3].map(x => html`<p>n° ${x}</p>`)}
      </div>
    `).toEqual(
      h('div', {}, [
        h('p', {}, ['n° ', '1']),
        h('p', {}, ['n° ', '2']),
        h('p', {}, ['n° ', '3'])
      ])
    )
  })

  it('should succefully parse custom components', () => {
    const Custom = () => {}
    expect(html`
      <${Custom} />
    `).toEqual(h(Custom, {}, []))
  })

  it('should succefully parse lists of custom components', () => {
    const Custom = () => {}
    expect(html`
      <div>
        ${[1, 2, 3].map(x => html`<${Custom} id=${x} />`)}
      </div>
    `).toEqual(
      h('div', {}, [
        h(Custom, { id: 1 }, []),
        h(Custom, { id: 2 }, []),
        h(Custom, { id: 3 }, [])
      ])
    )
  })
})
