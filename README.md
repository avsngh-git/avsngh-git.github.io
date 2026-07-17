# Av Singh's portfolio

This is a GitHub Pages portfolio powered by the [portfolYOU](https://github.com/yousinix/portfolYOU) remote Jekyll theme.

## Publish it

1. Push the `main` branch to GitHub.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**, then choose `main` and `/(root)`.
4. Save the setting. The site will publish at <https://avsngh-git.github.io/Portfoliogithubpages/>.

## Customize it

- Update your name, image, links, URL, and description in `_config.yml`.
- Edit the introduction and skill lists in `pages/about.md` and `_data/`.
- Add projects as Markdown files in `_projects/`.

## Preview locally

Install Ruby and Bundler, then run:

```sh
bundle install
bundle exec jekyll serve
```

Open `http://localhost:4000/Portfoliogithubpages/`.

## Transformer Variants case study

The project card and Overview route begin in `_projects/transformer-variants.html`.
The five-part narrative lives in `_includes/transformer-variants/chapters/`, with a
shared shell in `_layouts/transformer-case-study.html`. Frozen metrics and visualization
assets are versioned under `assets/data/transformer-variants/` and
`assets/transformer-variants/`. Source provenance, route structure, and editorial
decisions are recorded in `docs/transformer-variants-case-study.md`.

After building the site, validate both the frozen-data transforms and rendered Jekyll
output with:

```sh
node --test test/*.test.mjs
```

The theme is distributed under the [MIT License](https://github.com/yousinix/portfolYOU/blob/master/LICENSE).
