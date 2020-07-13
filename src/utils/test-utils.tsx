import React from 'react'
import { parsePath } from 'gatsby'

type CustomPageProps = {
  data?: object
  pageContext?: object
}

// Refer to PageProps: https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby/index.d.ts
export const createPageProps = (props: CustomPageProps = {}): any => {
  const { data, pageContext } = props

  const path = 'http://localhost'
  const title = 'Matt Shelley'

  const defaultData = {
    site: {
      siteMetadata: {
        title
      }
    },
    allMarkdownRemark: {
      edges: []
    }
  }

  const dataWithDefaults = { ...defaultData, ...(data || {}) }

  return {
    path,
    uri: '',
    location: parsePath(path),
    navigate: jest.fn(),
    children: undefined,
    pathContext: {},
    pageResources: {
      component: (() => <div />) as any,
      json: {
        data: dataWithDefaults,
        pageContext: pageContext || {}
      },
      page: {
        componentChunkName: '',
        path: '',
        webpackCompilationHash: '',
        matchPath: ''
      }
    },
    data: dataWithDefaults,
    pageContext: pageContext || {}
  }
}
