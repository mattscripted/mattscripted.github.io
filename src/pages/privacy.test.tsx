import React from 'react'
import { render, screen } from '@testing-library/react'

import { createPageProps } from 'utils/test-utils'

import Privacy from './privacy'

describe('Privacy', () => {
  it('renders privacy policy for no data collection', () => {
    render(<Privacy {...createPageProps()} />)

    expect(screen.getByText(/I collect no data, not even analytics\./)).toBeInTheDocument()
  })
})
