/**
 * SEO component that queries for data with
 *  Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from 'react'
import { Helmet } from 'react-helmet'
import { useStaticQuery, graphql } from 'gatsby'

type SEOProps = {
  title: string
  description?: string
  lang?: string
  meta?: React.DetailedHTMLProps<React.MetaHTMLAttributes<HTMLMetaElement>, HTMLMetaElement>[]
}

const SEO = (props: SEOProps) => {
  const { description, lang, meta, title } = props

  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
            social {
              twitter
            }
          }
        }
      }
    `
  )

  const metaDescription = description || site.siteMetadata.description

  const defaultMeta: React.DetailedHTMLProps<React.MetaHTMLAttributes<HTMLMetaElement>, HTMLMetaElement>[] = [
    {
      name: 'description',
      content: metaDescription
    },
    {
      property: 'og:title',
      content: title
    },
    {
      property: 'og:description',
      content: metaDescription
    },
    {
      property: 'og:type',
      content: 'website'
    },
    {
      name: 'twitter:card',
      content: 'summary'
    },
    {
      name: 'twitter:creator',
      content: site.siteMetadata.social.twitter
    },
    {
      name: 'twitter:title',
      content: title
    },
    {
      name: 'twitter:description',
      content: metaDescription
    }
  ]

  return (
    <Helmet
      htmlAttributes={{
        lang: lang || 'en'
      }}
      title={title}
      titleTemplate={`%s | ${site.siteMetadata.title}`}
      meta={defaultMeta.concat(meta || [])}
    />
  )
}

export default SEO
