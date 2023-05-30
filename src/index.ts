import { Request, Response } from 'express';
import * as _ from 'lodash';
import { version } from '../package.json';
import { getCsvDataStream } from './csv';
import { TransformsList } from 'adlib';
import { ServiceError } from './csv/service-error';

export = class OutputCsv2 {
  static type = 'output';
  static version = version;
  static routes = [
    {
      path: '/csv',
      methods: ['get'],
      handler: 'serve',
    },
  ];

  model: any;

  public async serve(req: Request, res: Response) {
    res.setHeader('Content-Type', 'text/csv');
    try {
      const csvTemplate = _.get(req, 'res.locals.csvTemplate') as Record<string, any>;
      const csvTemplateTransforms = _.get(req, 'app.locals.csvTemplateTransforms') as TransformsList;
      const csvFileName = _.get(req, 'app.locals.csvFileName', 'dataset');

      if (!csvTemplate) {
        throw new ServiceError('CSV feed template is not provided.', 400);
      }

      res.setHeader('Content-Disposition', `attachment; filename=${csvFileName}.csv`);

      const { csvStream } = getCsvDataStream(csvTemplate, csvTemplateTransforms);
      const datasetStream = await this.getDatasetStream(req);

      datasetStream
        .pipe(csvStream)
        .pipe(res);

      datasetStream.on('error', (err) => this.returnError(res, err));
    } catch (err) {
      this.returnError(res, err);
    }
  }

  private returnError(res: Response, err: Record<string, any>) {
    res.setHeader('Content-Disposition', 'inline');
    res.set('Content-Type', 'application/json');
    return res
      .status(_.get(err, 'response.status') || err.statusCode || 500)
      .send(_.get(err, 'response.data') || this.getErrorResponse(err));
  }

  private async getDatasetStream(req: Request) {
    try {
      return await this.model.pullStream(req);
    } catch (err) {
      throw new ServiceError(err.message, err.status || 500);
    }
  }

  private getErrorResponse(err: any) {
    return {
      error: _.get(
        err,
        'message',
        'Encountered error while processing request',
      ),
    };
  }
};