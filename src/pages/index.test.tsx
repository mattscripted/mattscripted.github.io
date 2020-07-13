import React from 'react'
import { render, screen } from '@testing-library/react'

import BlogIndex from './index'

import { createPageProps } from '../test-utils'

const MOCK_LAYOUT_TEST_ID = 'layout'
jest.mock('../components/layout', () => () => <div data-testid='layout' />)
jest.mock('../components/bio', () => () => <div />)
jest.mock('../components/seo', () => () => <div />)

describe('BlogIndex', () => {
  it('renders the layout', () => {
    const title = 'mattshelley.dev'
    const data = {
      site: {
        siteMetadata: {
          title
        }
      },
      allMarkdownRemark: {
        edges: []
      }
    }

    render(<BlogIndex {...createPageProps({ data })} />)

    expect(screen.queryByTestId(MOCK_LAYOUT_TEST_ID)).toBeInTheDocument()
  })
})
