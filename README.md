# Koop Output CSV
![Coverage](./coverage.svg)

This is a Koop output plugin that transforms data from Koop Provider into a CSV file.

## Use
The plugin uses highly customizable CSV template in JSON for field mapping which needs to be passed via Koop instance in `res.locals.csvTemplate`, `koop.server.locals.csvTemplateTransforms`. [adlib](https://github.com/Esri/adlib) is used to interpolate template. `koop.server.locals.csvFileName` is used for naming CSV filename. 


Visit the [KoopJS docs](https://koopjs.github.io/docs/basics/what-is-koop) for instructions on building and deploying a Koop app.

## Develop
```
# clone and install dependencies
git clone https://github.com/koopjs/koopjs-output-csv
cd koopjs-output-csv
npm i

# starts the example Koop app found in ./example-app.
npm run dev
```

## Test
Run the `npm t` commmand to spin up the automated tests.
