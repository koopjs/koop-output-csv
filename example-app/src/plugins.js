const HubSearchApi = require('@koopjs/koop-provider-hub-search-ogc')
const CsvOutput = require('@koopjs/koop-output-csv')

// list different types of plugins in order
const outputs = [
  {
    instance: CsvOutput
  }
]
const auths = []
const caches = []
const plugins = [
  {
    instance: HubSearchApi
  }
]

module.exports = [...outputs, ...auths, ...caches, ...plugins]
