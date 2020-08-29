(window.webpackJsonp=window.webpackJsonp||[]).push([[8],{f5SL:function(e,t,a){"use strict";a.r(t),a.d(t,"pageQuery",(function(){return h}));var n=a("q1tI"),l=a.n(n),r=a("9eSz"),s=a.n(r),i=a("9Dj+"),o=a("H8eV"),c=a("rB5o");t.default=function(e){var t=e.data,a=e.location,n=t.site.siteMetadata.title;return l.a.createElement(i.a,{location:a,title:n},l.a.createElement(o.a,{title:"Master's Thesis"}),l.a.createElement("h1",null,"Master's Thesis"),l.a.createElement("p",null,l.a.createElement("em",null,"Please note: This thesis and its supporting code were written in 2013, and no longer reflect the quality of my work. I have included this work for historical purposes.")),l.a.createElement("p",null,"Throughout 2012 and 2013, I wrote and completed my Master's thesis,"," ",l.a.createElement("a",{href:"/thesis/matt-shelley-thesis.pdf"},"On the Feasibility of using Use Case Maps for the Prevention of Sequence Breaking in Video Games"),", at Carleton University:"),l.a.createElement("blockquote",null,l.a.createElement("p",null,"\"Sequence Breaking\" is a type of feature interaction conflict that exists in video games where the player gains access to a portion of a game that should be inaccessible. In such instances, a game's subsuming feature—its storyline—is disrupted, as the predefined set of valid event sequences—events being uninterruptable units of functionality that further the game's story—is not honoured, as per the game designers' intentions. We postulate that sequence breaking often arises through bypassing geographic barriers, cheating, and misunderstanding on the player's behalf."),l.a.createElement("p",null,'Throughout this dissertation, we present an approach to preventing sequence breaking at run-time with the help of Use Case Maps. We create a "narrative manager" and traversal algorithm to monitor the player\'s narrative progress and check the legality of attempted event calls. We verify our solution through test cases and show its feasibility through a game, concluding that our solution is sufficient and feasible.')),l.a.createElement("p",null,"As part of this thesis, I implemented a testing tool to verify my solution and created a simple game called ",l.a.createElement("strong",null,"Dungeon Explorer")," to demonstrate that I could indeed prevent sequence breaking at run-time:"),l.a.createElement("ul",null,l.a.createElement("li",null,l.a.createElement("a",{href:"/thesis/ucm-testing-tool.htm"},"Interactive Testing Tool")),l.a.createElement("li",null,l.a.createElement("a",{href:"/thesis/dungeon-explorer.htm"},"Dungeon Explorer"))),l.a.createElement("h2",null,"Testing Tool"),l.a.createElement("p",null,"For details on the testing tool, please refer to chapter 4 of my thesis."),l.a.createElement("h2",null,"Dungeon Explorer"),l.a.createElement("p",null,"In Dungeon Explorer, the player navigates a simple dungeon, wherein they collect coins (yelllow circles). As visibility is limited, torches (orange triangles) can be gathered to increase the light. By progressing through the dungeon, by activating switches, more areas become accessible. Once all coins have been found the player can leave the dungeon, having beaten the game."),l.a.createElement("h3",null,"Controls"),l.a.createElement("ul",null,l.a.createElement("li",null,"Press ",l.a.createElement("strong",null,"Z")," to close text messages"),l.a.createElement("li",null,"Use the arrow keys to move around")),l.a.createElement("h3",null,"Cheats"),l.a.createElement("p",null,"Where Dungeon Explorer gets interesting is that the player can cheat in attempt to activate switches, which should not be accessible. Attempting to step on an 'illegal' switch will result in sequence breaking being detected, prevented, and, to a lesser extent, resolved."),l.a.createElement("ul",null,l.a.createElement("li",null,"Press ",l.a.createElement("strong",null,"Q")," to toggle light"),l.a.createElement("li",null,"Press ",l.a.createElement("strong",null,"W")," to walk through barriers"),l.a.createElement("li",null,"Press ",l.a.createElement("strong",null,"E")," to force switches to enabled (and thus ready to activate)")),l.a.createElement("p",null,"For further details, please refer to chapter 4 of my thesis. Please note that this game was only tested in both Firefox and Google Chrome on Windows 7."),l.a.createElement("h2",null,"Screenshots"),l.a.createElement(s.a,{fluid:t.testingToolImage.childImageSharp.fluid,style:{marginBottom:Object(c.a)(.5)}}),l.a.createElement(s.a,{fluid:t.dungeonExplorerImage.childImageSharp.fluid,style:{marginBottom:Object(c.a)(.5)}}),l.a.createElement(s.a,{fluid:t.dungeonExplorerDetectedImage.childImageSharp.fluid,style:{marginBottom:Object(c.a)(.5)}}))};var h="2337183820"}}]);
//# sourceMappingURL=component---src-pages-thesis-tsx-f112cc61663b73a1134c.js.map