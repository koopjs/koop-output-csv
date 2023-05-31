import { readableFromArray, streamToString } from '../test-helpers/stream-utils';
import { getCsvDataStream } from './';
import * as geojsonFeatures from '../test-helpers/mock-geojson-features.json';

async function generateCsv(dataset, template, templateTransforms) {
  const { csvStream } = getCsvDataStream(template, templateTransforms);

  const docStream = readableFromArray(dataset); 
  const csvString = await streamToString(docStream.pipe(csvStream));
  const CSVToArray = (data, delimiter = ',', omitFirstRow = false) =>
    data
      .slice(omitFirstRow ? data.indexOf('\n') + 1 : 0)
      .split('\n')
      .map(v => v.split(delimiter));
  return { csv: CSVToArray(csvString) };
}

describe('generating CSV', () => {

  it('should interprolate dataset stream to feed based upon template', async function () {
    const { csv } = await generateCsv(geojsonFeatures, {
      id: '{{id}}',
      title: '{{title}}',
      modified: '{{modified:toISO}}',
    }, {
      toISO: (_key, val) => {
        return new Date(val).toISOString();
      }
    });

    expect(csv.length).toBe(3);
    expect(csv[0]).toStrictEqual([ 'id', 'title', 'modified' ]);
    expect(csv[1]).toStrictEqual([ 'b08f51d9fbb34c4f9712533e26147903', 'Trail Mile Markers', '2023-05-08T01:23:44.000Z' ]);
    expect(csv[2]).toStrictEqual([ '3a9e6d16d7374b5b9740888edc12ac13', 'Condo Approval Lots', '2022-10-05T13:28:03.000Z' ]);
  });

});
