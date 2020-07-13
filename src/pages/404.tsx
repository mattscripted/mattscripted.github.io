import React from 'react'
import { graphql, PageProps } from 'gatsby'

import Layout from 'components/layout'
import SEO from 'components/seo'

type NotFoundQueryProps = {
  site: {
    siteMetadata: {
      title: string
    }
  }
}

const NotFoundPage = (props: PageProps<NotFoundQueryProps>) => {
  const { data, location } = props
  const siteTitle = data.site.siteMetadata.title

  return (
    <Layout location={location} title={siteTitle}>
      {/* eslint-disable-next-line react/jsx-pascal-case */}
      <SEO title='404: Not Found' />
      <h1>Not Found</h1>
      <p>Sorry, this page does not exist.</p>
    </Layout>
  )
}

export default NotFoundPage

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`
