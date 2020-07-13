import React from 'react'
import { graphql, PageProps } from 'gatsby'

import Layout from 'components/layout'
import SEO from 'components/seo'
import { rhythm } from 'utils/typography'

type PrivacyQueryProps = {
  site: {
    siteMetadata: {
      title: string
    }
  }
}

const Privacy = (props: PageProps<PrivacyQueryProps>) => {
  const { data, location } = props
  const siteTitle = data.site.siteMetadata.title

  return (
    <Layout location={location} title={siteTitle}>
      {/* eslint-disable-next-line react/jsx-pascal-case */}
      <SEO title='Privacy Policy' />
      <article>
        <h1
          style={{
            marginTop: rhythm(1),
            marginBottom: rhythm(1)
          }}
        >
          Privacy Policy
        </h1>
        <p>
          I collect no data, not even analytics.
        </p>
      </article>
    </Layout>
  )
}

export default Privacy

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`
