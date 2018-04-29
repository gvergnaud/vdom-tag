# vdom-tag

Es6 Tag function to create a virtual-dom tree from a template literal.

Very similar to [hyperx](https://github.com/choojs/hyperx), but has a better
support for custom components and supports multiple root elements.

This package does not provide any way to render the tree, you have to combine it
with a virtual dom implementation to make it useful (e.g. virtual-dom, React, ...).

```
npm install vdom-tag
```

### Examples

```js
import h from 'virtual-dom/h'
import createElement from 'virtual-dom/create-element'
import createTag from 'vdom-tag'

const html = createTag(h)

const title = 'world'

const tree = html`
  <div>
    <h1>hello ${title}!</h1>

    <h2>Connected users</h2>
    <ul>
      ${['Oh', 'My', 'God'].map(name => html`
        <li onclick=${() => console.log(name, 'clicked!')}>
          ${name}
        </li>
      `)}
    </ul>
  </div>
`

document.body.appendChild(createElement(tree))
```

### Features

#### Multiple root elements

```js
const list = html`
  <li>No</li>
  <li>need</li>
  <li>for</li>
  <li>React.Fragment</li>
  <li>!!</li>
`

const app = html`
  <div>
    ${list}
  </div>
`

document.body.appendChild(createElement(app))
```

#### Custom elements

```js
const MyComponent = () => html`<p>hey</p>`
const tree = html`
  <div>
    <${MyComponent} />
  </div>
`
```

#### With React

```js
import React from 'react'
import { render } from 'react-dom'
import createTag from 'vdom-tag'
const html = createTag(React.createElement)

const App = ({ name = 'React' }) => html`
  <p>Hello, ${name}!</p>
`

render(<App />, document.querySelector('#root'))
```
