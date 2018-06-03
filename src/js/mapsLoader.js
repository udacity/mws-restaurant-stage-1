import GoogleMapsLoader from "google-maps";
import { mapMarkerForRestaurant } from "./dbhelper";

const API_KEY = "AIzaSyDCcBBW2vjvek5Xyp4LvoJech4HLQyARWo";

GoogleMapsLoader.KEY = API_KEY;

export function initMap(el, options) {
  return new Promise(function(resolve, reject) {
    try {
      GoogleMapsLoader.load(function(google) {
        window.state.map = new google.maps.Map(el, options);
        window.google = google;
        if (window.state.map && window.google) {
          resolve(window.state.map);
        } else {
          reject("Unable to load Google Maps as expected");
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Add markers for current restaurants to the map.
 */
export const setMarkers = (restaurants, map = window.state.map) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = mapMarkerForRestaurant(restaurant, map);
    window.google.maps.event.addListener(marker, "click", () => {
      window.location.href = marker.url;
    });
    window.state.markers.push(marker);
  });
};
