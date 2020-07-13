import React from 'react'
import { render, screen } from '@testing-library/react'

import { createPageProps } from 'utils/test-utils'

import BlogIndex from './index'

jest.mock('components/bio', () => () => <div />)

describe('BlogIndex', () => {
  it('renders the page header', () => {
    render(<BlogIndex {...createPageProps()} />)

    expect(screen.queryByRole('heading', { name: 'Matt Shelley' })).toBeInTheDocument()
  })
})
