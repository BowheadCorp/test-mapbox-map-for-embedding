import type { IControl, Map } from 'mapbox-gl';
import { CURRENT_YEAR, SALE_START_YEAR } from './config';
import { year2color } from './util';

/**
 * A custom Legend mapbox-gl component for Mapbox to colour-code our purchase
 * year dots.
 */
export default class PurchaseYearLegend implements IControl {
  private map: Map;
  private container: HTMLDivElement;

  /** When the legend is added to the map, build and add the DOM node. */
  onAdd(map: Map): HTMLDivElement {
    this.map = map;
    this.container = document.createElement('div');
    this.container.className = 'map-legend mapboxgl-ctrl';

    const blocks = [];

    // Loop backwards from the current year to the year of when we began to sell
    // stuff. Push one "legend block" to the legend for each year, in that order.
    for (let year = CURRENT_YEAR; year >= SALE_START_YEAR; year--) {
      blocks.push(`
        <li style="--map-legend-color: ${year2color(year)}">
          <div class="map-legend__year--text">${year}</div>
          <div class="map-legend__year--stripe"></div>
        </li>
      `);
    }

    // Concatenate all the "legend block"s together in a <ul> and add a heading.
    // Set this as the innerHTML for this component's container.
    this.container.innerHTML = `
      <h6 class="map-legend__title">Legend</h6>
      <ul>${blocks.join('')}</ul>
    `;

    return this.container;
  }

  /** When the legend is removed from the map, delete the DOM node. */
  onRemove() {
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }

  /** By default, position the legend in the top-right corner of the map. */
  getDefaultPosition() {
    return 'top-right';
  }
}
