import { adlib, TransformsList } from 'adlib';
import { ServiceError } from './service-error';
import * as _ from 'lodash';

export type CsvDatasetTemplate = Record<string, any>;
type Feature = {
  type: string,
  geometry: Record<string, any> | undefined,
  properties: Record<string, any>
};

export function compileCsvFeedEntry(
  geojsonFeature: Feature | undefined,
  feedTemplate: CsvDatasetTemplate,
  feedTemplateTransforms: TransformsList | undefined): string {
  try {
    const csvItem = generateCsvItem(geojsonFeature, feedTemplate, feedTemplateTransforms);
    return csvItem;
  } catch (err) {
    throw new ServiceError(err.message, 500);
  }
}

function generateCsvItem(geojsonFeature: Feature, feedTemplate: CsvDatasetTemplate, feedTemplateTransforms: TransformsList | undefined): string {
  const { properties } = geojsonFeature;

  const interpolatedFields = adlib(
    feedTemplate,
    properties,
    feedTemplateTransforms
  );

  return _.join(_.values(interpolatedFields), ',');
}