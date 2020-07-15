import React from 'react'
import { graphql, PageProps, Link } from 'gatsby'

import Layout from 'components/layout'
import SEO from 'components/seo'

type AboutQueryProps = {
  site: {
    siteMetadata: {
      title: string
    }
  }
}

const About = (props: PageProps<AboutQueryProps>) => {
  const { data, location } = props
  const { title: siteTitle } = data.site.siteMetadata

  return (
    <Layout location={location} title={siteTitle}>
      {/* eslint-disable-next-line react/jsx-pascal-case */}
      <SEO title='About' />
      <h1>About</h1>
      <p>
        I am a Senior Software Engineer.
      </p>
      <p>
        In 2013, I completed my Master of Computer Science with my
        {' '}
        <Link to='/thesis'>thesis on sequence breaking in video games</Link>.
      </p>
      <p>
        Since then, I have worked professionally as a Front-End Developer, Intermediate Software Engineer,
        and Senior Software Engineer.
      </p>
      <p>I write about software development and self-improvement.</p>
    </Layout>
  )
}

export default About

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`
