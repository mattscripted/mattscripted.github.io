import React from 'react'
import { render, screen } from '@testing-library/react'

import { createPageProps } from 'utils/test-utils'

import BlogIndex from './index'

describe('BlogIndex', () => {
  it('renders the page header', () => {
    render(<BlogIndex {...createPageProps()} />)

    expect(screen.queryByRole('heading', { name: 'Matt Shelley' })).toBeInTheDocument()
  })
})
