import mapInterface from './mapInterface';

const apiCalls = {
  loactionInfomation({ location, lat, lng }) {
    fetch(`https://api.weather.gov/points/${lat},${lng}`)
      .then(res => res.json())
      .then(data => {
        const {
          properties: { forecast, forecastZone },
        } = data;
        this.weatherForecast({
          location,
          forecastUrl: forecast,
          forecastZoneUrl: forecastZone,
        });
      });
  },

  forecastZone({ location, forecastZoneUrl, currentForecast }) {
    fetch(forecastZoneUrl)
      .then(res => res.json())
      .then(data => {
        if (!mapInterface.getMap().getLayer(location)) {
          // check to see if layer is already rendered to map
          mapInterface.addPolygon({
            id: location,
            type: data.type,
            properties: { zone: data.properties, currentForecast },
            geometry: data.geometry,
          });
        }
      });
  },

  weatherForecast({ location, forecastUrl, forecastZoneUrl }) {
    fetch(forecastUrl)
      .then(forecast => forecast.json())
      .then(data => {
        const {
          properties: { periods },
        } = data;
        this.forecastZone({
          location,
          forecastZoneUrl,
          currentForecast: periods[0],
        });
      });
  },
};

export default apiCalls;
