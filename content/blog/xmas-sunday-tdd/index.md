---
title: "Walkthrough: Finding Christmas Sundays with Test-Driven Development"
date: "2020-08-08"
description: "Applying Test-Driven Development to the Rosetta Code 'Day of the Week' challenge"
---

I recently fell in love with Test-Driven Development (TDD). I find the practice enables us to write high-quality code with the confidence to refactor anytime. Honestly, it has been a breath of fresh air to software development.

If you're unfamiliar with the concept, Test-Driven Development means writing tests before writing production code. Basically, we follow this process:

1. Write a failing test for some new requirement
2. Write the least amount of code to make all tests pass
3. Repeat for the next requirement

With each change, we can refactor our code knowing it still works as intended.

## Christmas Sundays

As an early example, I picked up the [Rosetta Code challenge 'Day of the Week' on freeCodeCamp](https://www.freecodecamp.org/learn/coding-interview-prep/rosetta-code/day-of-the-week):

> Write a function that takes a start year and an end year and return an array of all the years where the 25th of December will be a Sunday.

I will refer to this example as *Christmas Sundays*.


## Making the Algorithm

First, I want to create a test that checks the output. I expect an array.

```ts
// findChristmasSundays.test.ts

import findChristmasSundays from './findChristmasSundays'

describe('findChristmasSundays', () => {
  it('returns an array', () => {
    expect(findChristmasSundays()).toBeInstanceOf(Array)
  })
})
```

This test fails because I have not even written the `findChristmasSundays()` function. So, let's write the least code we can to pass the test:

```ts
// findChristmasSundays.ts

function findChristmasSundays (): number[] {
  return []
}

export default findChristmasSundays
```

Notice we have not set inputs, because we don't need them--*yet*.

Next, I want to check that we receive an array with the start year, if the start year has Christmas on a Sunday. To find such a year, I looked through the calendar to get 2022.

```ts
// findChristmasSundays.test.ts (snippet)

it('returns the start year, if the start year has Christmas on a Sunday', () => {
  const christmasSundayYear = 2022
  const actual = findChristmasSundays(christmasSundayYear)

  expect(actual).toContain(christmasSundayYear)
})
```

Since I added a new input, I also updated the previous test to include an input. In my opinion, it is totally fine to refactor tests just like we would refactor production code. In fact, I encourage it.

Then, I wrote the simplest code to pass the test:

```ts
// findChristmasSundays.ts

function findChristmasSundays (startYear: number): number[] {
  return [startYear]
}
```

Technically, all of our tests pass right now. But, obviously, this approach can't quite be right.

Well, it depends on what we are trying to accomplish. If the function was named `convertToArray()`, it would be valid, wouldn't it? Except, we're not building `convertToArray()`, we're building `findChristmasSundays()`, so we still have more work to do.

Okay, so what if we pass in a year that does not have Christmas on a Sunday. Again, I found such a year on the calendar.

```ts
// findChristmasSundays.test.ts (snippet)

it('does not return the start year, if the start year does not have Christmas on a Sunday', () => {
  const nonChristmasSundayYear = 2020
  const actual = findChristmasSundays(nonChristmasSundayYear)

  expect(actual).not.toContain(nonChristmasSundayYear)
})
```

Our test fails because we return a year where Christmas does not occur on a Sunday, since our previous code just returned an array with the start year. Now, we can refactor our function to actually check if the year should be included.

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

Great! We can now determine if a year has Christmas on a Sunday.

Next, we need to check for a range of years by using start year and end year. At this point, we have the choice whether to include the end year in the range.

Personally, I want to exclude the end year to discourage the function from being used for a single year like `findChristmasSundays(2020, 2020)`. To me, this usage feels awkward. Instead, I think `hasChristmasSunday(2020)` would be better for checking just one year.

(Come to think of it, that new function may be useful later on. Hmm...)

To enforce this decision, I want to throw an error if the end year is less than or equal to the start year.

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

I refactored the tests to support 2 inputs for the function. With TDD, we can refactor with confidence, so don't be afraid to refactor your tests too.

Next, I checked for a range of dates:

```ts
// findChristmasSundays.test.ts (snippet)

it('returns all years where Christmas is on a Sunday within a range', () => {
  const startYear = 2000
  const endYear = 2030

  const actual = findChristmasSundays(startYear, endYear)
  const expected = [2005, 2011, 2016, 2022]

  expect(actual).toStrictEqual(expected)
})
```

```ts
// findChristmasSundays.ts

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

Functionally, we almost have everything! But, let's step back and recall that I said the end year should not be included in the range. Instead, we should only check for `startYear <= year < endYear`. So, let's update our solution:

```ts
// findChristmasSundays.test.ts (snippet)

it('does not include the end year, even if the end year has Christmas on a Sunday', () => {
  const startYear = 2000
  const endYear = 2022

  const actual = findChristmasSundays(startYear, endYear)
  const expected = [2005, 2011, 2016]

  expect(actual).toStrictEqual(expected)
})
```

```ts
// findChristmasSundays.ts (snippet)

for (let year = startYear; year < endYear; year++) {
  // ...
}
```

### Further Validation

While functionally the code works, you may have noticed that I could pass some more bad inputs. For example, `number` refers to integer and non-integer values. Let's catch a few more cases while we're here:

```ts
// findChristmasSundays.test.ts (snippet)

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
// findChristmasSundays.ts (snippet)

if (startYear <= 0 || !Number.isInteger(startYear)) {
  throw new Error('startYear must be a positive integer')
}
if (endYear <= 0 || !Number.isInteger(endYear)) {
  throw new Error('endYear must be a positive integer')
}
```

### Refactor

With all of our test cases in place, we can now refactor the code with confidence to clean things up. We'll know if we broke something because one of the tests will fail. This is the beauty of Test-Driven Development.

Here's my final, refactored solution:

```ts
// findChristmasSundays.test.ts

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
// findChristmasSundays.ts

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

Alternatively, you may view the gist here: [TDD with Christmas Sundays](https://gist.github.com/mattscripted/a53660858bfb3d983752b9ab0b37d904).


## In Closing

With Test-Driven Development, we write tests before our production code. As as a result, we naturally write tests in parallel to our code, treating tests with the same respect as our code. Test-Driven Development encourages us to write high-quality software by refactoring with confidence.
