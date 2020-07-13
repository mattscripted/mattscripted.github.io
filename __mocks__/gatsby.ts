/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'
import defaultQuery from '__fixtures__/default-query'

const gatsby = jest.requireActual('gatsby')

module.exports = {
  ...gatsby,
  graphql: jest.fn(),
  Link: jest.fn().mockImplementation(
    // these props are invalid for an `a` tag
    ({
      activeClassName,
      activeStyle,
      getProps,
      innerRef,
      partiallyActive,
      ref,
      replace,
      to,
      ...rest
    }) =>
      React.createElement('a', {
        ...rest,
        href: to
      })
  ),
  StaticQuery: jest.fn(),
  useStaticQuery: jest.fn().mockImplementation(() => defaultQuery)
}
