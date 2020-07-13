const defaultQuery = {
  site: {
    siteMetadata: {
      title: 'Matt Shelley',
      author: {
        name: 'Matt Shelley',
        summary: 'Senior Software Engineer'
      },
      description: 'Personal blog of Matt Shelley',
      siteUrl: 'https://mattshelley.dev/',
      social: {
        twitter: 'matt_scripted'
      }
    }
  },
  avatar: {
    childImageSharp: {
      fixed: {
        width: '100',
        height: '100',
        src: 'avatar.png',
        srcSet: 'avatar.png'
      }
    }
  },
  allMarkdownRemark: {
    edges: []
  }
}

export default defaultQuery
