import React from 'react'
import { graphql, PageProps } from 'gatsby'
import Image from 'gatsby-image'

import Layout from 'components/layout'
import SEO from 'components/seo'

import { rhythm } from 'utils/typography'

type ImageProps = {
  childImageSharp: {
    fixed: any
  }
}

type ThesisQueryProps = {
  testingToolImage: ImageProps,
  dungeonExplorerImage: ImageProps,
  dungeonExplorerDetectedImage: ImageProps,
  site: {
    siteMetadata: {
      title: string
    }
  }
}

const Thesis = (props: PageProps<ThesisQueryProps>) => {
  const { data, location } = props
  const siteTitle = data.site.siteMetadata.title

  return (
    <Layout location={location} title={siteTitle}>
      {/* eslint-disable-next-line react/jsx-pascal-case */}
      <SEO title="Master's Thesis" />
      <h1>Master's Thesis</h1>
      <p>
        Throughout 2012 and 2013, I wrote and completed my Master's thesis,
        {' '}
        <a href='/thesis/matt-shelley-thesis.pdf'>On the Feasibility of using Use Case Maps for the Prevention of Sequence Breaking in Video Games</a>,
        at Carleton University:
      </p>

      <blockquote>
        <p>
          "Sequence Breaking" is a type of feature interaction conflict that exists in video games where
          the player gains access to a portion of a game that should be inaccessible. In such instances, a
          game's subsuming feature—its storyline—is disrupted, as the predefined set of valid event
          sequences—events being uninterruptable units of functionality that further the game's story—is
          not honoured, as per the game designers' intentions. We postulate that sequence breaking often
          arises through bypassing geographic barriers, cheating, and misunderstanding on the player's behalf.
        </p>
        <p>
          Throughout this dissertation, we present an approach to preventing sequence breaking at
          run-time with the help of Use Case Maps. We create a "narrative manager" and traversal
          algorithm to monitor the player's narrative progress and check the legality of attempted
          event calls. We verify our solution through test cases and show its feasibility through a
          game, concluding that our solution is sufficient and feasible.
        </p>
      </blockquote>

      <p>
        As part of this thesis, I implemented a testing tool to verify my solution and created a
        simple game called <strong>Dungeon Explorer</strong> to demonstrate that I could indeed
        prevent sequence breaking at run-time:
      </p>
      {/* These links will not work in development due to a Gatsby bug */}
      <ul>
        <li>
          <a href='/thesis/ucm-testing-tool.htm'>Interactive Testing Tool</a>
        </li>
      </ul>

      <h2>Screenshots</h2>
      <Image
        fixed={data.testingToolImage.childImageSharp.fixed}
        style={{
          marginRight: rhythm(1 / 2)
        }}
      />
      <Image
        fixed={data.dungeonExplorerImage.childImageSharp.fixed}
        style={{
          marginRight: rhythm(1 / 2)
        }}
      />
      <Image
        fixed={data.dungeonExplorerDetectedImage.childImageSharp.fixed}
        style={{
          marginRight: rhythm(1 / 2)
        }}
      />
    </Layout>
  )
}

export default Thesis

export const pageQuery = graphql`
  query {
    testingToolImage: file(absolutePath: { regex: "/thesis/testing_tool.png/" }) {
      childImageSharp {
        fixed(width: 640, height: 480) {
          ...GatsbyImageSharpFixed
        }
      }
    }
    dungeonExplorerImage: file(absolutePath: { regex: "/thesis/dungeon_explorer.png/" }) {
      childImageSharp {
        fixed(width: 640, height: 480) {
          ...GatsbyImageSharpFixed
        }
      }
    }
    dungeonExplorerDetectedImage: file(absolutePath: { regex: "/thesis/dungeon_explorer_detected.png/" }) {
      childImageSharp {
        fixed(width: 640, height: 480) {
          ...GatsbyImageSharpFixed
        }
      }
    }
    site {
      siteMetadata {
        title
      }
    }
  }
`
