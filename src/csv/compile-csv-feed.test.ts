import { compileCsvFeedEntry } from './compile-csv-feed';
import * as geojsonFeatures from '../test-helpers/mock-geojson-features.json';
import { ServiceError } from './service-error';

describe('generating CSV', () => {
  it('should throw 400 error if template contains transformer that is not defined', async function () {
    const csvTemplate = {
      title: '{{name}}',
      description: '{{description}}',
      keyword: '{{tags}}',
      issued: '{{created:toISO}}'
    }

    try {
      compileCsvFeedEntry(geojsonFeatures[0], csvTemplate, {});
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toHaveProperty('statusCode', 500);
    }
  });

  it('should throw error if geojson from provider is missing', async function () {
    const csvTemplate = {
      title: '{{name}}',
      description: '{{description}}',
      keyword: '{{tags}}',
      issued: '{{created:toISO}}'
    };

    expect(() => {
      compileCsvFeedEntry(undefined, csvTemplate, {});
    }).toThrow(ServiceError);
  });
});