import type { Feature, FeatureCollection, Point } from 'geojson';
import parseLinkHeader = require('parse-link-header');

export interface PersonGeoJsonProperties {
  purchaseYear: number;
}

export type PeopleFeatureCollection = FeatureCollection<Point, PersonGeoJsonProperties>;
export type PersonFeature = Feature<Point, PersonGeoJsonProperties>;

export const loadGeoJsonData = async (url: string, apiKey: string): Promise<PeopleFeatureCollection> => {
  // Append api key to url.
  const u = new URL(url);
  u.searchParams.append('access_token', apiKey);

  // Fetch the first round of data.
  const res = await fetch(u.toString());
  const linkHeader = res.headers.get('Link');

  // Push the json parser promise onto an array, but don't wait for it to
  // resolve just yet.
  const dataParsers = [res.json() as Promise<PeopleFeatureCollection>];

  // Try parsing the Link header of the response to check if a "next" URL is
  // specified.
  let rels = parseLinkHeader(linkHeader);

  while (rels && rels.next) {
    // Fetch the next URL.
    const nextUrl = new URL(rels.next.url);
    nextUrl.searchParams.append('access_token', apiKey);

    const nextRes = await fetch(nextUrl.toString());
    const nextLinkHeader = nextRes.headers.get('Link');

    // Push the next URL's json parser onto the data array.
    dataParsers.push(nextRes.json() as Promise<PeopleFeatureCollection>);

    // Parse the next URL's link header. If it also has a rel="next", that means
    // there's another page of results to fetch. So, we loop.
    rels = parseLinkHeader(nextLinkHeader);
  }

  // Wait for all JSON parsers to simultaneously resolve:
  const data = await Promise.all(dataParsers);

  // Concatenate all the sub-`FeatureCollection`s' features into a single array of features.
  const features = data
    .map((feature_collection) => feature_collection.features)
    .reduce((acc, features) => acc.concat(features), []);

  // Return the final GeoJSON `FeatureCollection`.
  return {
    type: 'FeatureCollection',
    features,
  }
};
