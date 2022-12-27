<p align="center">
  <img width="200" src="https://open-wc.org/hero.png"></img>
</p>

## Open-wc Starter App

[![Built with open-wc recommendations](https://img.shields.io/badge/built%20with-open--wc-blue.svg)](https://github.com/open-wc)

## Quickstart

To get started:

```sh
npm init @open-wc
# requires node 10 & npm 6 or higher
```

## Scripts

- `start` runs your app for development, reloading on file changes
- `start:build` runs your app after it has been built using the build command
- `build` builds your app and outputs it in your `dist` directory
- `test` runs your test suite with Web Test Runner
- `lint` runs the linter for your project

## Tooling configs

For most of the tools, the configuration is in the `package.json` to reduce the amount of files in your project.

If you customize the configuration a lot, you can consider moving them to individual files.


## Graph pre-processing

The graphviz graphs in `./assets/*.gv` should be pre-processed via `npm run parsegraphs` which will convert any `.gv` into a `.graph.json` file. We expect the `./assets` folder to have `some_name.gv` files (dot graph descriptions), `some_name.svg` files (rendered graph SVG that might include manual edits), and `some_name.graph.json` files (parsegraphs output, used by the <ai-map> logic). 

It is best if the svgs for rendering to be created via Inkscape's "Save As... Optimized SVG" to keep the files as compact as possible.