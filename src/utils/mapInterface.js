import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import apiCalls from './apis';

const mapInterface = {
  renderedMap: null,
  lastGeocode: null,

  mapInit(mapContainer) {
    mapboxgl.accessToken = process.env.MAPBOX_KEY;
    this.renderedMap = new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/streets-v10',
      center: [-122.486052, 37.830348],
      zoom: 10,
    });
    this.addMapControls();
  },

  addMapControls() {
    this.renderedMap.addControl(new mapboxgl.NavigationControl());
    this.renderedMap.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      })
    );
    this.renderedMap.addControl(new mapboxgl.FullscreenControl());
    this.renderedMap.addControl(
      new MapboxGeocoder({
        accessToken: process.env.MAPBOX_KEY,
        placeholder: 'Search for a location',
      }).on('result', location => {
        const { text: locationName, center } = location.result;
        const [lng, lat] = center;

        if (location.result.center.toString() !== this.lastGeocode) {
          // prevents double fire of result event see https://github.com/mapbox/mapbox-gl-geocoder/issues/99
          apiCalls.loactionInfomation({
            location: locationName,
            lat,
            lng,
          });
        }
        this.lastGeocode = location.result.center.toString();
      }),
      'top-left'
    );
  },

  getMap() {
    return this.renderedMap;
  },

  getCenter() {
    return this.renderedMap.getCenter();
  },

  addPolygon({ id, type, geometry, properties }) {
    const layer = {
      id,
      type: 'fill',
      source: {
        type: 'geojson',
        data: {
          type,
          geometry,
          properties,
        },
      },
      paint: {
        'fill-color': '#0074D9',
        'fill-opacity': 0.7,
      },
    };
    this.renderedMap.addLayer(layer);
    this.addPolygonClick(id);
    this.addPolygonHover(id);
  },

  addPolygonClick(layerId) {
    this.renderedMap.on('click', layerId, e => {
      const {
        properties: { zone, currentForecast },
      } = e.features[0];
      const parseForecast = JSON.parse(currentForecast);
      const parseZone = JSON.parse(zone);

      const popUp = new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(
          this.buildPopUpTemplete({ zone: parseZone, forecast: parseForecast })
        );
      popUp._content.classList.add('polygon-popup');
      popUp.addTo(this.renderedMap);
    });
  },

  addPolygonHover(layerId) {
    this.renderedMap.on('mouseenter', layerId, () => {
      this.renderedMap.getCanvas().style.cursor = 'pointer';
    });

    this.renderedMap.on('mouseleave', layerId, () => {
      this.renderedMap.getCanvas().style.cursor = '';
    });
  },

  buildPopUpTemplete({
    zone: { name: location },
    forecast: {
      name: forecastTime,
      icon,
      shortForecast,
      detailedForecast,
      temperature,
      temperatureUnit,
      windSpeed,
      windDirection,
    },
  }) {
    return `
      <section class="polygon-popup-content">
        <h4>${location}</h4>
        <div class="current-weather">
          <img src=${icon} alt="${shortForecast} icon" />
          <div>
            <h6>Current Temperature: <span>${temperature} &deg${temperatureUnit}</span></h6>
            <h6>Current Wind: <span>${windSpeed} ${windDirection}</span></h6>
          </div>
        </div>
        <h5>${forecastTime}</h5>
        <p>${detailedForecast}</p>
      </section>
    `;
  },
};

export default mapInterface;
