import { FeedFormatterStream } from './feed-formatter-stream';
import { compileCsvFeedEntry } from './compile-csv-feed';
import { TransformsList } from 'adlib';
import * as _ from 'lodash';

export function getCsvDataStream(feedTemplate: Record<string, any>, feedTemplateTransforms: TransformsList) {
  const csvHeaders = getCsvHeaders(feedTemplate);

  const streamFormatter = (chunk) => {
    return compileCsvFeedEntry(chunk, feedTemplate, feedTemplateTransforms);
  };
  
  return {
    csvStream: new FeedFormatterStream(csvHeaders, '', '\n', streamFormatter)
  };
}

function getCsvHeaders(templateHeader): string {
  return `${_.join(_.keys(templateHeader), ',')}\n`;
}
