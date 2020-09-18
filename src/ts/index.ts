// Vendor CSS imports to be bundled by Parcel:
import 'mapbox-gl/dist/mapbox-gl.css';
import 'normalize.css';

// JS imports:
import mapboxgl = require('mapbox-gl');

import { MAPBOX_API_KEY, MAPBOX_SOURCE_DATASET, MAP_ICON_SIZE } from './config';
import { loadGeoJsonData, PersonFeature } from './data';
import mapMarker from './map-marker';
import PurchaseYearLegend from './purchase-year-legend';
import { rem2px, year2color } from './util';

//////////////////////////////////
// Map setup follows from here. //
//////////////////////////////////

// Set mapbox-gl API key. Required for it to work.
mapboxgl.accessToken = MAPBOX_API_KEY;

// Get a custom map marker to be cloned later.
const customMarker = mapMarker();

// Create our Mapbox map.
let map;

// This could error out randomly if one of Mapbox's web workers experiences a
// cache miss. To prevent the rest of our script not running, wrap it in a
// try/catch block.
try {
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [0, 0],
    zoom: 1,
    logoPosition: 'bottom-right',
  });
} catch (e) {
  console.error(e);
}

// Add the scale display to the bottom-left.
map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

// Add the navigation control to the top-left.
map.addControl(
  new mapboxgl.NavigationControl({ visualizePitch: true }),
  'top-left',
);

// Add our custom purchase year legend in its default location.
map.addControl(new PurchaseYearLegend());

////////////////////////////////////////////////////////////////////////////
// The code for the purchase year popup when you hover over a dot follows //
// here.                                                                  //
////////////////////////////////////////////////////////////////////////////

// Create a popup, but don't add it to the map yet.
const popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
});

// When the mouse enters something in the 'people' layer, open the popup.
map.on('mouseenter', 'people', (e) => {
  // Change the cursor style as a UI indicator.
  map.getCanvas().parentElement.style.cursor = 'pointer';

  const feature = (e.features[0] as unknown) as PersonFeature;
  const coordinates = feature.geometry.coordinates.slice() as [number, number];
  const purchaseYear = feature.properties.purchaseYear;

  if (purchaseYear) {
    // Ensure that if the map is zoomed out such that multiple copies of the
    // feature are visibile, the popup appears over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    // Populate the popup, set its coordinates, and add it to the map based on
    // the feature found.
    popup
      .setLngLat(coordinates)
      .setHTML(`Purchased ${purchaseYear}`)
      .addTo(map);
  }
});

// When the mouse exits something in the 'people' layer, close the popup.
map.on('mouseleave', 'people', () => {
  map.getCanvas().parentElement.style.cursor = '';
  popup.remove();
});

//////////////////////////////////////////////////////////////////////////
// All the code that follows is run asyncronously after waiting for the //
// dataset to be fetched.                                               //
//////////////////////////////////////////////////////////////////////////

/** A small utility function to promise-ify the `map.on('event', (e) => {})` pattern */
const onMap = <T extends keyof mapboxgl.MapEventType>(event: T):
  Promise<mapboxgl.MapEventType[T] & mapboxgl.EventData> =>
  new Promise((resolve, _reject) => map.on(event, resolve));

(async () => {
  // Fetch our people data.
  const peopleData = await loadGeoJsonData(
    `https://api.mapbox.com/datasets/v1/${MAPBOX_SOURCE_DATASET}/features`,
    MAPBOX_API_KEY,
  );

  // Wait for the map to load.
  await onMap('load');

  // Add a 'people' source to our map based off our people data.
  map.addSource('people', { type: 'geojson', data: peopleData });

  // Add a layer called 'people', based on our 'people' source. The layer will
  // consist of circles at the same location as each person icon on the map, but
  // one pixel larger than each icon. This acts like a "hitbox", and allows us to
  // show a popup whenever the point is hovered over. We make the circles invisible,
  // because they are drawn on the canvas and we want to do fancy CSS stuff with
  // our custom HTML map icons.
  map.addLayer({
    id: 'people',
    source: 'people',
    type: 'circle',
    paint: {
      // Make the circle one pixel larger than the size of the map icon.
      'circle-radius': rem2px(MAP_ICON_SIZE / 2) + 1,

      // The user should never see this colour. We just do this for the occassional
      // spot of debugging.
      'circle-color': '#00FFFF',

      // Hide the circle.
      'circle-opacity': 0,
    },
  });

  // Loop through the people in peopleData to add fancy, custom HTML icons for
  // each one.
  for (const person of peopleData.features) {
    // Only colour the icon if someone remembered to add a `purchaseYear` in the
    // Mapbox Studio dataset editor. Otherwise, just make it white.
    const iconColor = person.properties.purchaseYear
      ? year2color(person.properties.purchaseYear)
      : 'white';

    // Clone our `customMarker`.
    const currentCustomMarker = customMarker.cloneNode(true) as HTMLDivElement;

    // Set the CSS Custom Property `--map-marker-color` to the `iconColor` we
    // calculated above.
    currentCustomMarker.style.setProperty('--map-marker-color', iconColor);

    // Add the marker to the map.
    new mapboxgl.Marker({ element: currentCustomMarker })
      .setLngLat(person.geometry.coordinates as [number, number])
      .addTo(map);
  }
})();
