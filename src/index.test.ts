import * as _ from 'lodash';
import * as express from 'express';
import * as request from 'supertest';
import { PassThrough } from 'stream';

import * as geojsonFeatures from './test-helpers/mock-geojson-features.json';

import { createMockKoopApp } from './test-helpers/create-mock-koop-app';
import { readableFromArray } from './test-helpers/stream-utils';

function buildPluginAndApp(csvTemplate, csvTemplateTransforms, csvFileName) {
  let Output;

  jest.isolateModules(() => {
    Output = require('./');
  });

  const plugin = new Output();
  plugin.model = {
    pullStream: jest.fn().mockResolvedValue(readableFromArray(geojsonFeatures)),
  };

  const app = createMockKoopApp();
  app.get('/csv', function (req, res, next) {
    req.app.locals.csvTemplateTransforms = csvTemplateTransforms;
    res.locals.csvTemplate = csvTemplate;
    res.locals.csvFileName = csvFileName;
    app.use((err, _req, res, _next) => {
      res.status(err.status || 500)
      res.send({
        error: err.message
      })
    })
    next();
  }, plugin.serve.bind(plugin));

  return [plugin, app];
}

describe('Output Plugin', () => {
  let plugin;
  let app: express.Application;
  const CSVToArray = (data, delimiter = ',', omitFirstRow = false) =>
    data
      .slice(omitFirstRow ? data.indexOf('\n') + 1 : 0)
      .split('\n')
      .map(v => v.split(delimiter));

  beforeEach(() => {
    [plugin, app] = buildPluginAndApp({}, {}, '');
  });

  it('is configured correctly', () => {
    expect(plugin.constructor.type).toBe('output');
    expect(plugin.constructor.version).toBeDefined();
    expect(plugin.constructor.routes).toEqual([
      {
        path: '/csv',
        methods: ['get'],
        handler: 'serve',
      },
    ]);
  });

  it('returns CSV with interpolated dataset value from CSV template', async () => {
    const feedTemplate = {
      id: '{{id}}',
      title: '{{title}}',
      modified: '{{modified:toISO}}',
    };

    const feedTemplateTransforms = {
      toISO: (_key, val) => {
        return new Date(val).toISOString();
      }
    };

    const csvFileName = 'filename';

    [plugin, app] = buildPluginAndApp(feedTemplate, feedTemplateTransforms, csvFileName);
    await request(app)
      .get('/csv')
      .expect('Content-Type', 'text/csv')
      .expect(200)
      .expect(res => {
        expect(res.text).toBeDefined();
        const csvBody = CSVToArray(res.text);
        expect(plugin.model.pullStream).toHaveBeenCalledTimes(1);
        expect(res.headers['content-disposition']).toBe(`attachment; filename=${csvFileName}.csv`);
        expect(csvBody.length).toBe(3);
        expect(csvBody[0]).toStrictEqual([ 'id', 'title', 'modified' ]);
        expect(csvBody[1]).toStrictEqual([ 'b08f51d9fbb34c4f9712533e26147903', 'Trail Mile Markers', '2023-05-08T01:23:44.000Z' ]);
        expect(csvBody[2]).toStrictEqual([ '3a9e6d16d7374b5b9740888edc12ac13', 'Condo Approval Lots', '2022-10-05T13:28:03.000Z' ]);
      });
  });

  it('should encode filename', async () => {
    const feedTemplate = {
      id: '{{id}}',
      title: '{{title}}',
      modified: '{{modified:toISO}}',
    };

    const feedTemplateTransforms = {
      toISO: (_key, val) => {
        return new Date(val).toISOString();
      }
    };

    const csvFileName = 'Ben & Jerry';

    [plugin, app] = buildPluginAndApp(feedTemplate, feedTemplateTransforms, csvFileName);
    await request(app)
      .get('/csv')
      .expect('Content-Type', 'text/csv')
      .expect(200)
      .expect(res => {
        expect(res.text).toBeDefined();
        const csvBody = CSVToArray(res.text);
        expect(plugin.model.pullStream).toHaveBeenCalledTimes(1);
        expect(res.headers['content-disposition']).toBe(`attachment; filename=Ben%20&%20Jerry.csv`);
        expect(csvBody.length).toBe(3);
        expect(csvBody[0]).toStrictEqual([ 'id', 'title', 'modified' ]);
        expect(csvBody[1]).toStrictEqual([ 'b08f51d9fbb34c4f9712533e26147903', 'Trail Mile Markers', '2023-05-08T01:23:44.000Z' ]);
        expect(csvBody[2]).toStrictEqual([ '3a9e6d16d7374b5b9740888edc12ac13', 'Condo Approval Lots', '2022-10-05T13:28:03.000Z' ]);
      });
  });

  it('should return error if CSV template is incorrect format', async () => {
    const csvTemplate = 'test';
    const csvFileName = 'filename';

    [plugin, app] = buildPluginAndApp(csvTemplate, undefined, csvFileName);
    await request(app)
      .get('/csv')
      .expect('Content-Type', /application\/json/)
      .expect(400)
      .expect((res) => {
        expect(res.body).toEqual({ error: 'CSV feed template is not correct type.' });
      });
  });

  it('sets status to 500 if something blows up', async () => {
    
    plugin.model.pullStream.mockRejectedValue(Error('Couldnt get stream'));

    await request(app)
      .get('/csv')
      .expect('Content-Type', /application\/json/)
      .expect(500)
      .expect((res) => {
        expect(res.body).toEqual({ error: 'Couldnt get stream' });
      });
  });

  it('should return CSV with interpolated dataset value from CSV template', async () => {
    [plugin, app] = buildPluginAndApp(undefined, undefined, '');
    await request(app)
      .get('/csv')
      .expect('Content-Type', /application\/json/)
      .expect(400)
      .expect((res) => {
        expect(res.body).toEqual({ error: 'CSV feed template is not provided.' });
      });
  });

  it('returns error if stream emits an error', async () => {
    const mockReadable = new PassThrough();

    plugin.model.pullStream.mockResolvedValue(mockReadable);
    const mockError = new Error('stream error')

    setTimeout(() => {
      mockReadable.emit('error', mockError)
    }, 200)
    await request(app)
      .get('/csv')
      .expect(500)
      .expect((res) => {
        expect(res.text).toEqual(JSON.stringify({ error: 'stream error' }));
      });
  });
});
