# mattshelley.dev

Personal blog of Matt Shelley. Built with [Gatsby](https://www.gatsbyjs.org) and [Gatsby Starter Blog](https://github.com/gatsbyjs/gatsby-starter-blog).

## Getting Started

1. Clone the repo, and then run:

```
npm install
npm run start
```

2. Navigate to [http://localhost:8000/](http://localhost:8000/).

To make changes, create a new branch off `develop` and then submit a Pull Request back into `develop`.

## Integration and Deployment

Upon submitting a Pull Request into `develop`, GitHub will automatically run quality checks.

Upon merging a branch into `develop`, GitHub will automatically build the latest code as a new commit into `master`, and then deploy the site to GitHub Pages.

This approach was based off [Tiago Duarte's CI/CD tutorial with GitHub Actions](https://coletiv.com/blog/how-to-setup-continuous-integration-and-deployment-workflows-for-reactjs-using-github-actions/).
