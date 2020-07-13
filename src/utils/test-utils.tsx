import React from 'react'
import { parsePath } from 'gatsby'

type CustomPageProps = {
  data?: object
  pageContext?: object
}

// Refer to PageProps: https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby/index.d.ts
export const createPageProps = (props: CustomPageProps): any => {
  const { data, pageContext } = props
  const path = 'http://localhost'

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
        data: data || {},
        pageContext: pageContext || {}
      },
      page: {
        componentChunkName: '',
        path: '',
        webpackCompilationHash: '',
        matchPath: ''
      }
    },
    data: data || {},
    pageContext: pageContext || {}
  }
}
