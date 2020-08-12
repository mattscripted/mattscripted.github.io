---
title: "JS: Export vs Export Default"
date: "2020-08-12"
description: "Figuring out the best practice around export vs export default"
---

Over the years, I have seen conflicting opinions around when to use JavaScript's `export` vs `export default`. One project may embrace `export default`, while another may avoid it. Admittedly, I flip-flop between projects, too.

Looking for best practices, the documentation offers some suggestions but no definitive answers. Meanwhile, many developers dislike `export default`.

So, what should we do?

## What the documentation says

To begin, let's be clear that `export` refers to named exports, and `export default` refers to the default export.

### Named Exports
Named exports look like:

```js
// module.js
export const value = 123

// another-module.js
import { value } from './module'
```

According to the MDN web docs, "named exports are useful to export several values" [1]. Further, we can have zero or more named exports per module, and must reference the exact names when importing [1].


### Default Export

Default exports look like:

```js
// module.js
const value = 123
export default value

// another-module.js
import value from './module'
```

According to the MDN web docs, default exports are used "to export a single value or to have a have a fallback value for your module" [1]. We can have one default export per module, and can name it however we like when importing [1].

Under the hood, it appears that `export default` is syntactic sugar to create a named export called `default` [2][3]. Thus, these statements are equivalent:

```js
// module.js
const value = 123
export default value
```

```js
// module.js
const value = 123
export { value as default }
```

Further, these import statements are equivalent:

```js
// another-module.js
import value from './module'
```

```js
// another-module.js
import { default as value } from './module'
```

(If you've ever seen `require('./module').default`, now you know why.)   

So, the default export aims to simplify some cases of named exports.

## What others say

## What I say

Personally, when I work on a new project where I can influence our approach, I like to use `export default` to export the main thing from a file, and `export` for helpers and constants. While there are flaws with `export default`, the syntax helps me focus on doing one thing and one thing well per file.

```js
// SignupForm.js
import React from 'react'
import * as yup from 'yup'

export const validationSchema = yup.object().shape({
  ...
})

const Component = (props) => { ... }

export default Component

// AnotherComponent.js
import Component, { validationSchema } from './SignupForm'
```

```js
// primes.js
const getPrimes = () => { ... }

export const getMedianPrimes = () => { ... }

export default getPrimes

// another-module.js
import getPrimes, { getMedianPrimes } from './primes'
```

Conversely, when I work on an existing project, I follow the team. If we have agreed on an approach, then it's better to be consistent and do right by everyone. After all, we create better software when we work together.

So, really, *it depends*.


## In Closing

To summarize, we can use `export default` for the main thing and `export` for everything else. However, there are mixed opinions on whether we should use `export default` at all, or stick with just `export` for everything. Ultimately, there is no clear answer. So, I believe the best choice is to favour consistency and do what's right by the team.

## References

1. ["Export." MDN Web Docs](https://developer.mozilla.org/en-US/docs/web/javascript/reference/statements/export)
2. ["ExportEntries." Ecma International](https://tc39.es/ecma262/#sec-exports-static-semantics-exportentries)
3. ["Modules." Exploring JS: JavaScript books for programmers](https://exploringjs.com/es6/ch_modules.html)
