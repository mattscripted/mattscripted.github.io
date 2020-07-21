import React, { ReactNode } from 'react'
import { Link } from 'gatsby'

import { rhythm, scale } from 'utils/typography'

type LayoutProps = {
  location: {
    pathname: string
  }
  title: string
  children: ReactNode
}

const Layout = (props: LayoutProps) => {
  const { location, title, children } = props
  const rootPath = `${__PATH_PREFIX__}/`
  let header

  if (location.pathname === rootPath) {
    header = (
      <h1
        style={{
          ...scale(1.2),
          marginBottom: rhythm(1.5),
          marginTop: 0
        }}
      >
        <Link
          style={{
            boxShadow: 'none',
            color: 'inherit'
          }}
          to='/'
        >
          {title}
        </Link>
      </h1>
    )
  } else {
    header = (
      <h3
        style={{
          fontFamily: 'Montserrat, sans-serif',
          marginTop: 0
        }}
      >
        <Link
          style={{
            boxShadow: 'none',
            color: 'inherit'
          }}
          to='/'
        >
          {title}
        </Link>
      </h3>
    )
  }

  return (
    <div
      style={{
        marginLeft: 'auto',
        marginRight: 'auto',
        maxWidth: rhythm(24),
        padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`
      }}
    >
      <header>{header}</header>
      <main>{children}</main>
      <footer>
        <nav>
          <Link to='/about'>About</Link> &middot; <Link to='/thesis'>Thesis</Link> &middot; <Link to='/privacy'>Privacy Policy</Link>
        </nav>
        &copy; {new Date().getFullYear()} Matt Shelley.
      </footer>
    </div>
  )
}

export default Layout
