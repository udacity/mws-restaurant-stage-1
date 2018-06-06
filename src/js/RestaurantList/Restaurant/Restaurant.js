import { html } from "lit-html";
import { getImage } from "../../imageLoader";
import {
  urlForRestaurant,
  updateRestaurant,
  fetchRestaurantByCuisineAndNeighborhood
} from "../../dbhelper";
import { updateRestaurants } from "../../main";
import Heart from "./components/Heart";

// GLOBAL Click Handler.
window.clickFavorite = target => {
  const tar2 = document.querySelector("button[data-restaurantID='11']");
  const restaurantID = Number(target.dataset.restaurantid);
  const isfavorite = target.dataset.isfavorite == "true";
  updateRestaurant(
    { id: restaurantID, is_favorite: !isfavorite },
    (err, res) => {
      //lit-html is clever, so we can just rerender and it will diff things
      updateRestaurants();
    }
  );
};

function Restaurant(restaurant) {
  return html`
  <li>
  <div class="responsively-lazy" data-restaurantid=${
    restaurant.id
  } style="padding-bottom: 75%;">
    <img 
      alt="Image of ${restaurant.name}" 
      class="restaurant-img"
      sizes="(max-width: 450px) 90vw, 600px" 
      data-srcset=${getImage(restaurant.photograph).srcSet}
      srcset="data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
      src=${getImage(restaurant.photograph).src}
    />
  </div>
  <h1>${restaurant.name}</h1>
  <p>${restaurant.neighborhood}</p>
  <p>${restaurant.address}</p>
  <div style="display: flex; flex-direction: row; justify-content: space-between;">
    <a href=${urlForRestaurant(restaurant)}>View Details</a>
  <button 
    type="button"
    role="button"
    aria-label="Mark ${restaurant.name} as Favorite"
    aria-pressed=${restaurant.is_favorite}
    style="padding-top: 10px; background-color: white; border: none; color: white;" 
    class="favorite-button" 
    data-restaurantid=${restaurant.id} 
    onclick="clickFavorite(this)"
    data-isfavorite=${restaurant.is_favorite}
  >
    ${Heart(40, 40, restaurant.is_favorite)}
  </button>
  </div>
  </li>
`;
}

export default Restaurant;
