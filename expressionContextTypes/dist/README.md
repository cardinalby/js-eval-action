## Purpose

This package supplements [js-eval-action](https://github.com/cardinalby/js-eval-action) GitHub action.

Install this package to get type declarations of the global vars 
(see [JavaScript evaluation context](https://github.com/cardinalby/js-eval-action#javascript-evaluation-context)) 
available in a code passed to the `expression` input or in a file set by the `jsFile` input.

The purpose of this package is to enable type checking and autocompletion in your JS file. 
install `js-eval-action-expression-context` package of the version equal to `js-eval-action` used version.
Installation of this package isn't required for using [js-eval-action](https://github.com/cardinalby/js-eval-action).

Add
```js
// @ts-check
```
at the beginning of your `.js` file to enable type checking (verified in WebStorm and Visual Studio Code).

## Example

Please look at [download-release-asset-action](https://github.com/cardinalby/download-release-asset-action) 
as an example of composite action based on [js-eval-action](https://github.com/cardinalby/js-eval-action) 
call that stores JavaScript code in a separate file.