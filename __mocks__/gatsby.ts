/* eslint-disable @typescript-eslint/no-unused-vars */
const React = require('react')
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
  useStaticQuery: jest.fn().mockImplementation(() => ({
    site: {
      siteMetadata: {
        title: 'Matt Shelley',
        author: {
          name: 'Matt Shelley',
          summary: 'Senior Software Engineer'
        },
        description: 'Personal blog of Matt Shelley',
        siteUrl: 'https://mattshelley.dev/',
        social: {
          twitter: 'matt_scripted'
        }
      }
    }
  }))
}
