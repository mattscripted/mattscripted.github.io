import React from 'react'
import { parsePath } from 'gatsby'

import defaultQuery from '__fixtures__/default-query'

type CustomPageProps = {
  data?: object
  pageContext?: object
}

// Refer to PageProps: https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby/index.d.ts
export const createPageProps = (props: CustomPageProps = {}): any => {
  const { data, pageContext } = props

  const dataWithDefaults = { ...defaultQuery, ...(data || {}) }
  const path = dataWithDefaults.site.siteMetadata.siteUrl

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
