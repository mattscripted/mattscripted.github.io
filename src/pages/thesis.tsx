import React from 'react'
import { graphql, PageProps } from 'gatsby'
import Image from 'gatsby-image'

import Layout from 'components/layout'
import SEO from 'components/seo'

import { rhythm } from 'utils/typography'

type ImageProps = {
  childImageSharp: {
    fluid: any
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
        <em>
          Please note: This thesis and its supporting code were written in 2013, and no longer reflect
          the quality of my work. I have included this work for historical purposes.
        </em>
      </p>

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
        <li>
          <a href='/thesis/dungeon-explorer.htm'>Dungeon Explorer</a>
        </li>
      </ul>

      <h2>Testing Tool</h2>
      <p>For details on the testing tool, please refer to chapter 4 of my thesis.</p>

      <h2>Dungeon Explorer</h2>
      <p>
        In Dungeon Explorer, the player navigates a simple dungeon, wherein they collect coins (yelllow circles).
        As visibility is limited, torches (orange triangles) can be gathered to increase the light. By progressing
        through the dungeon, by activating switches, more areas become accessible. Once all coins have been found
        the player can leave the dungeon, having beaten the game.
      </p>

      <h3>Controls</h3>
      <ul>
        <li>
          Press <strong>Z</strong> to close text messages
        </li>
        <li>
          Use the arrow keys to move around
        </li>
      </ul>

      <h3>Cheats</h3>
      <p>
        Where Dungeon Explorer gets interesting is that the player can cheat in attempt to activate switches,
        which should not be accessible. Attempting to step on an 'illegal' switch will result in sequence breaking
        being detected, prevented, and, to a lesser extent, resolved.
      </p>
      <ul>
        <li>
          Press <strong>Q</strong> to toggle light
        </li>
        <li>
          Press <strong>W</strong> to walk through barriers
        </li>
        <li>
          Press <strong>E</strong> to force switches to enabled (and thus ready to activate)
        </li>
      </ul>
      <p>
        For further details, please refer to chapter 4 of my thesis. Please note that this game was only tested
        in both Firefox and Google Chrome on Windows 7.
      </p>

      <h2>Screenshots</h2>
      <Image
        fluid={data.testingToolImage.childImageSharp.fluid}
        style={{
          marginBottom: rhythm(1 / 2)
        }}
      />
      <Image
        fluid={data.dungeonExplorerImage.childImageSharp.fluid}
        style={{
          marginBottom: rhythm(1 / 2)
        }}
      />
      <Image
        fluid={data.dungeonExplorerDetectedImage.childImageSharp.fluid}
        style={{
          marginBottom: rhythm(1 / 2)
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
        fluid(maxWidth: 640, maxHeight: 480) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    dungeonExplorerImage: file(absolutePath: { regex: "/thesis/dungeon_explorer.png/" }) {
      childImageSharp {
        fluid(maxWidth: 640, maxHeight: 480) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    dungeonExplorerDetectedImage: file(absolutePath: { regex: "/thesis/dungeon_explorer_detected.png/" }) {
      childImageSharp {
        fluid(maxWidth: 640, maxHeight: 480) {
          ...GatsbyImageSharpFluid
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
