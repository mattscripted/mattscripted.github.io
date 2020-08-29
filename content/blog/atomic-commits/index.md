---
title: "Atomic Commits"
date: "2020-08-29"
description: "Writing small commits with helpful messages"
---

There was a time where my git commits were nothing more than saving my work. I made a lot of changes, wrote an unhelpful message, and committed.

Unfortunately, when we write commits this way, we lose confidence in our work, reduce our understanding, and hurt the quality of our software [1].

Instead, we can write atomic commits: small changes with helpful messages.


## But first, what even are git commits?

We can think of git commits as snapshots of our project at specific moments in time. Individually, each commit consists of a change and a message explaining the change. Together, commits tell the story of our project [2].

Consider this commit to a README to explain branching structure:

```
Clarify branches in README
```

```
README.md

+ ## Branches
+ 
+ - `master` is the initial empty project
+ - `solution` is the intended solution after the talk
+ 
```

Now, consider these commit messages from `git log`:

```
* Display search results after searching
* Implement submit button for search
* Implement search text box
* Update all packages to support latest React testing-library
* Clarify branches in README
* Split test command into test and test:watch to support Husky
* Remove cruft from create-react-app, and set up empty project
* Install standard for linting
* Initialize project using create-react-app
```

When we thoughtfully create commits, we can confidently jump to any point in time, because we understand the story of our project. We trust our software.


## Make small changes

If we extend the Unix philosophy of "do one thing, and do it well," [3] a commit should *change one thing, and change it well*.

With this mindset, our approach to writing software becomes:
1. Change one thing (feature, bug, refactor, etc.) [1]
2. Verify things work as expected
3. Commit
4. Repeat

With small changes, we can safely revert to a previous working state when our latest changes go awry. Thus, we can confidently move forward.


## Write helpful messages

Personally, I write short commit messages that reference the ticket and provide a quick summary of why / what things changed.

```
PROJ-123 Update all font sizes to match latest designs
```

More specifically, I like Peter Hutterer's thoughts on commit messages.

He reminds us that software is collaborative, and commit messages show whether we are good collaborators. He adds [4]:

> A good commit message should answer three questions ...
> 
> 1. Why is it necessary? ...
> 2. How does it address the issue? ...
> 3. What effects does the patch have? ...

If your commit messages often read `PR feedback` or `Fixed a bug`, please take a moment to improve them. The extra thought to your commit messages will help both you and your team in the long run.

With helpful messages, we encourage collaboration by documenting why and what things changed. We improve our understanding.


## In Closing

With atomic commits, we make small changes with helpful messages, so we build confidence in our work and our understanding of it. Atomic commits encourage us to write high-quality software.

## References

1. ["Why I Create Atomic Commits In Git." Clarice Bouwer](https://dev.to/cbillowes/why-i-create-atomic-commits-in-git-kfi)
2. ["Git commit." Atlassian](https://www.atlassian.com/git/tutorials/saving-changes/git-commit)
3. ["Basics of the Unix Philosophy." Eric Steven Raymond](https://homepage.cs.uri.edu/~thenry/resources/unix_art/ch01s06.html)
4. ["On commit messages." Peter Hutterer](http://who-t.blogspot.com/2009/12/on-commit-messages.html)