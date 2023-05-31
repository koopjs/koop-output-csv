const config = require('config')
const Koop = require('koop')
const plugins = require('./plugins')

// initiate a koop app
const koop = new Koop()

koop.server.use((req, res, next) =>{
  req.res.locals.siteIdentifier = 'https://datahub-dc-dcgis.hub.arcgis.com'
  
  req.res.locals.csvTemplate = {
    id: '{{id}}',
    created: '{{created}}',
    modified: '{{modified:toISO}}',
  };

  req.app.locals.csvTemplateTransforms = {
    toISO: (_key, val) => {
      return new Date(val).toISOString();
    }
  };
  next();
});

// register koop plugins
plugins.forEach((plugin) => {
  koop.register(plugin.instance, plugin.options)
})

// start the server
koop.server.listen(config.port, () => koop.log.info(`Koop server listening at ${config.port}`))
