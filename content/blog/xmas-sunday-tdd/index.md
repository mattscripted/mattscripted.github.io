---
title: "Walkthrough: Finding Christmas Sundays with Test-Driven Development"
date: "2020-08-04"
description: "Applying Test-Driven Development to the Rosetta Code 'Day of the Week' challenge"
---

I recently started using Test-Driven Development in my day-to-day software development. I used to hate TDD, but now it's made code so much more enjoyable. I feel it has fundamentally changed how I approach writing software.

As an early example, I picked up the [Rosetta Code challenge 'Day of the Week' on freeCodeCamp](https://www.freecodecamp.org/learn/coding-interview-prep/rosetta-code/day-of-the-week):

> Write a function that takes a start year and an end year and return an array of all the years where the 25th of December will be a Sunday.

# TDD Approach

1. Writing a failing unit test
2. Write the least amount of code to pass all tests
3. Repeat

# Making the Algorithm

First, I want to create a unit test that checks the output. Based on the description, no matter what I pass in, I expect an array.

```ts
// findChristmasSundays.test.ts

import findChristmasSundays from './findChristmasSundays'

describe('findChristmasSundays', () => {
  it('returns an array', () => {
    expect(findChristmasSundays()).toBeInstanceOf(Array)
  })
})
```

This test fails because I have not even written the `findChristmasSundays` method. So, let's write the least code we can to pass the test:

```ts
// findChristmasSundays.ts

function findChristmasSundays (): number[] {
  return []
}

export default findChristmasSundays
```

Notice we haven't even set inputs yet, because we just don't need them.

Next, I want to return an array with the start year, if the start year has Christmas on a Sunday. I simply looked up the next calendar year where Christmas occurs on a Sunday: 2022.

```ts
// findChristmasSundays.test.ts (snippet)

it('returns the start year, if the start year has Christmas on a Sunday', () => {
  const christmasSundayYear = 2022
  const actual = findChristmasSundays(christmasSundayYear)

  expect(actual).toContain(christmasSundayYear)
})
```

Since I added a new input, I also updated the previous test to include an input.

Then, I wrote the simplest code to pass the test:

```ts
// findChristmasSundays.ts

function findChristmasSundays (startYear: number): number[] {
  return [startYear]
}
```

Technically, all of our tests pass right now. But, obviously, this approach can't quite be right.

Well, it depends on what we are trying to accomplish. If the function was named `convertToArray()`, it would be valid, wouldn't it? Except, we're not building `convertToArray()`, we're building `findChristmasSundays()`, so we still have more work to do.

Okay, so what if we pass in a year that does not have Christmas on a Sunday. (Again, I found such a year in my calendar.)

```ts
// findChristmasSundays.test.ts (snippet)

it('does not return the start year, if the start year does not have Christmas on a Sunday', () => {
  const nonChristmasSundayYear = 2020
  const actual = findChristmasSundays(nonChristmasSundayYear)

  expect(actual).not.toContain(nonChristmasSundayYear)
})
```

Our test fails because we return a year where Christmas does not occur on a Sunday. Now, we can refactor our method to actually check if the year should be included.

```ts
// findChristmasSundays.ts (snippet)

function findChristmasSundays (startYear: number): number[] {
  const DAY_OF_WEEK_SUNDAY = 0

  // With Date, months are 0-indexed, so 11 means December
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
  const christmasDate = new Date(startYear, 11, 25)

  if (christmasDate.getDay() === DAY_OF_WEEK_SUNDAY) {
    return [startYear]
  }

  return []
}
```

Great! We can not distinguish if a year has Christmas on a Sunday or not.

Next, we need to check for a range of years by using both a start year and an end year.

We have the choice whether to include the end year in the range or treat it as an upper bound. Personally, I want to exclude the end year to discourage the method from being used for a single year like `findChristmasSundays(2020, 2020)`. It just feels awkward. I think a separate method like `hasChristmasSunday(2020)` would be better for that case. Come to think of it, that may be a useful method later on. Hmm...

In fact, to enforce this point, I want to throw an error if the end year is less than or equal to the start year.

```ts
// findChristmasSundays.test.ts (snippet)

it('throws an error, if the end year is less than or equal to the start year', () => {
  const expectedError = new Error('endYear must be greater than startYear')

  expect(() => findChristmasSundays(2000, 2000))
    .toThrowError(expectedError)
  expect(() => findChristmasSundays(2000, 1999))
    .toThrowError(expectedError)
})
```

```ts
// findChristmasSundays.ts (snippet)

function findChristmasSundays (startYear: number, endYear: number): number[] {
  if (endYear <= startYear) {
    throw new Error('endYear must be greater than startYear')
  }

  // ...
}
```

I refactored the unit tests to support 2 inputs for the method. With TDD, we can encourage refactoring, so don't be afraid to refactor your tests too!

Next, I checked for a range of dates:

```ts
it('returns all years where Christmas is on a Sunday within a range', () => {
  const startYear = 2000
  const endYear = 2030

  const actual = findChristmasSundays(startYear, endYear)
  const expected = [2005, 2011, 2016, 2022]

  expect(actual).toStrictEqual(expected)
})
```

```ts
function findChristmasSundays (startYear: number, endYear: number): number[] {
  if (endYear <= startYear) {
    throw new Error('endYear must be greater than startYear')
  }

  const DAY_OF_WEEK_SUNDAY = 0
  const christmasSundays = []

  for (let year = startYear; year <= endYear; year++) {
    // With Date, months are 0-indexed, so 11 means December
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
    const christmasDate = new Date(year, 11, 25)

    if (christmasDate.getDay() === DAY_OF_WEEK_SUNDAY) {
      christmasSundays.push(year)
    }
  }

  return christmasSundays
}

export default findChristmasSundays
```

Functionally, we almost have everything! But, let's step back and recall that I said the end year should not be included in the range. Instead, we only check for `startYear <= year < endYear`. So, let's update our solution:

```ts
it('does not include the end year, even if the end year has Christmas on a Sunday', () => {
  const startYear = 2000
  const endYear = 2022

  const actual = findChristmasSundays(startYear, endYear)
  const expected = [2005, 2011, 2016]

  expect(actual).toStrictEqual(expected)
})
```

```ts
// ...
for (let year = startYear; year < endYear; year++) {
// ...
```

# Further Validation

While functionally my code works, you may have noticed that I could pass some more bad inputs. For example, `number` refers to integer and non-integer values. Let's catch a few more cases while we're here:

```ts
it('throws an error, if the start year is not a positive integer', () => {
  const expectedError = new Error('startYear must be a positive integer')

  expect(() => findChristmasSundays(0.1, 1))
    .toThrowError(expectedError)
  expect(() => findChristmasSundays(0, 1))
    .toThrowError(expectedError)
  expect(() => findChristmasSundays(-1, 1))
    .toThrowError(expectedError)
})

it('throws an error, if the end year is not a positive integer', () => {
  const expectedError = new Error('endYear must be a positive integer')

  expect(() => findChristmasSundays(1, 0.1))
    .toThrowError(expectedError)
  expect(() => findChristmasSundays(1, 0))
    .toThrowError(expectedError)
  expect(() => findChristmasSundays(1, -1))
    .toThrowError(expectedError)
})
```

```ts
if (startYear <= 0 || !Number.isInteger(startYear)) {
  throw new Error('startYear must be a positive integer')
}
if (endYear <= 0 || !Number.isInteger(endYear)) {
  throw new Error('endYear must be a positive integer')
}
```

# Refactor

With all of our test cases in place, we can now refactor the code with confidence to clean things up a bit. We'll know if we broke something because one of the tests will fail.

Here's my final solution:

```ts
import findChristmasSundays from './findChristmasSundays'

describe('findChristmasSundays', () => {
  it('throws an error, if the start year is not a positive integer', () => {
    const expectedError = new Error('startYear must be a positive integer')

    expect(() => findChristmasSundays(0.1, 1))
      .toThrowError(expectedError)
    expect(() => findChristmasSundays(0, 1))
      .toThrowError(expectedError)
    expect(() => findChristmasSundays(-1, 1))
      .toThrowError(expectedError)
  })

  it('throws an error, if the end year is not a positive integer', () => {
    const expectedError = new Error('endYear must be a positive integer')

    expect(() => findChristmasSundays(1, 0.1))
      .toThrowError(expectedError)
    expect(() => findChristmasSundays(1, 0))
      .toThrowError(expectedError)
    expect(() => findChristmasSundays(1, -1))
      .toThrowError(expectedError)
  })

  it('throws an error, if the end year is less than or equal to the start year', () => {
    const earlierYear = 2000
    const laterYear = 2001

    const expectedError = new Error('endYear must be greater than startYear')

    expect(() => findChristmasSundays(earlierYear, earlierYear))
      .toThrowError(expectedError)
    expect(() => findChristmasSundays(laterYear, earlierYear))
      .toThrowError(expectedError)
  })

  it('returns an array', () => {
    expect(findChristmasSundays(2000, 2001)).toBeInstanceOf(Array)
  })

  it('returns the start year, if the start year has Christmas on a Sunday', () => {
    const christmasSundayYear = 2022
    const actual = findChristmasSundays(christmasSundayYear, christmasSundayYear + 1)

    expect(actual).toContain(christmasSundayYear)
  })

  it('does not return the start year, if the start year does not have Christmas on a Sunday', () => {
    const nonChristmasSundayYear = 2020
    const actual = findChristmasSundays(nonChristmasSundayYear, nonChristmasSundayYear + 1)

    expect(actual).not.toContain(nonChristmasSundayYear)
  })

  it('returns all years where Christmas is on a Sunday within a range', () => {
    const startYear = 2000
    const endYear = 2030

    const actual = findChristmasSundays(startYear, endYear)
    const expected = [2005, 2011, 2016, 2022]

    expect(actual).toStrictEqual(expected)
  })

  it('does not include the end year, even if the end year has Christmas on a Sunday', () => {
    const startYear = 2000
    const endYear = 2022

    const actual = findChristmasSundays(startYear, endYear)
    const expected = [2005, 2011, 2016]

    expect(actual).toStrictEqual(expected)
  })
})
```

```ts
function hasChristmasSunday (year: number): boolean {
  const DAY_OF_WEEK_SUNDAY = 0

  // With Date, months are 0-indexed, so 11 means December
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
  const christmasDate = new Date(year, 11, 25)

  return christmasDate.getDay() === DAY_OF_WEEK_SUNDAY
}

function findChristmasSundays (startYear: number, endYear: number): number[] {
  if (startYear <= 0 || !Number.isInteger(startYear)) {
    throw new Error('startYear must be a positive integer')
  }
  if (endYear <= 0 || !Number.isInteger(endYear)) {
    throw new Error('endYear must be a positive integer')
  }
  if (endYear <= startYear) {
    throw new Error('endYear must be greater than startYear')
  }

  const christmasSundays = []

  for (let year = startYear; year < endYear; year++) {
    if (hasChristmasSunday(year)) {
      christmasSundays.push(year)
    }
  }

  return christmasSundays
}

export default findChristmasSundays
```