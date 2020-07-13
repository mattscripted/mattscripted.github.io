import React from 'react'
import { render, screen } from '@testing-library/react'

import { createPageProps } from 'utils/test-utils'

import Privacy from './privacy'

describe('Privacy', () => {
  it('renders privacy policy for no data collection', () => {
    const title = 'Matt Shelley'
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

    render(<Privacy {...createPageProps({ data })} />)

    expect(screen.getByText(/I collect no data, not even analytics\./)).toBeInTheDocument()
  })
})
