class jsHelper{static lazyLoadImages(){Array.from(document.getElementsByTagName("picture")).forEach(e=>{if(this.isInViewport(e)){var t=Array.from(e.getElementsByTagName("source"));t.forEach(e=>{e.getAttribute("srcset")||e.setAttribute("srcset",e.getAttribute("data-srcset"))}),Array.from(e.getElementsByTagName("img")).forEach(e=>{e.getAttribute("src")||e.setAttribute("src",e.getAttribute("data-src")),e.addEventListener("load",()=>{e.removeAttribute("data-src"),t.forEach(e=>{e.removeAttribute("data-srcset")})})})}})}static isInViewport(e){var t=e.getBoundingClientRect();return t.top>=0&&t.left>=0&&t.bottom<=(window.innerHeight||document.documentElement.clientHeight)&&t.right<=(window.innerWidth||document.documentElement.clientWidth)}static toJSONString(e){for(var t={},n=e.querySelectorAll("input, select, textarea"),a=0;a<n.length;++a){var r=n[a],l=r.name,s=r.value;l&&(t[l]=s)}return JSON.stringify(t)}}let restaurant,reviews;var map;document.getElementById("submit-review").addEventListener("click",e=>{e.preventDefault();const t=document.getElementById("review-form");DBHelper.postData(DBHelper.DATABASE_URL.reviews,jsHelper.toJSONString(t))}),window.initMap=(()=>{fetchRestaurantFromURL((e,t)=>{if(e)console.error(e);else{try{self.map=new google.maps.Map(document.getElementById("map"),{zoom:16,center:t.latlng,scrollwheel:!1})}catch(e){console.log("Load of google map failed")}document.getElementById("map").style.display="block",fillBreadcrumb(),DBHelper.mapMarkerForRestaurant(self.restaurant,self.map)}})}),fetchRestaurantFromURL=(e=>{if(self.restaurant)return void e(null,self.restaurant);const t=getParameterByName("id");t?DBHelper.fetchRestaurantById(t,(t,n)=>{self.restaurant=n,n?(fillRestaurantHTML(),e(null,n)):console.error(t)}):(error="No restaurant id in URL",e(error,null))}),fillRestaurantHTML=((e=self.restaurant)=>{document.getElementById("restaurant-name").innerHTML=e.name,document.getElementById("restaurant-address").innerHTML=e.address;const t=document.getElementById("restaurant-img");if(DBHelper.imageUrlForRestaurant(e)){let n=document.createElement("picture");n.className="restaurant-img-available lazy-loading",t.prepend(n);const a=DBHelper.imageUrlForRestaurant(e).replace(".jpg","");let r=document.createElement("source");r.setAttribute("data-srcset",`${a}-800_large_1x.jpg 1x,${a}-800_large_2x.jpg 2x`),r.media="(min-width: 1400px)",n.appendChild(r),(r=document.createElement("source")).setAttribute("data-srcset",`${a}-400_small_1x.jpg 1x,${a}-400_small_2x.jpg 2x`),r.media="(max-width: 400px)",n.appendChild(r),(r=document.createElement("source")).setAttribute("data-srcset",`${a}-400_small_1x.jpg 1x,${a}-400_small_2x.jpg 2x`),r.media="(min-width: 1000px) and (max-width: 1399px)",n.appendChild(r),(r=document.createElement("source")).setAttribute("data-srcset",`${a}-800_large_1x.jpg 1x,${a}-800_large_2x.jpg 2x`),r.media="(min-width: 401px) and (max-width: 999px)",n.appendChild(r);const l=document.createElement("img");l.alt=`${e.name} Restaurant`,l.setAttribute("data-src",`${a}-400_small_1x.jpg`),n.appendChild(l)}else{let e=document.createElement("p");e.className="restaurant-img-not-available",e.innerHTML="Image not Available",t.prepend(e)}document.getElementById("restaurant-cuisine").innerHTML=e.cuisine_type,document.getElementById("restaurant_id").setAttribute("value",getParameterByName("id")),e.operating_hours&&fillRestaurantHoursHTML(),fetchReviews(),jsHelper.lazyLoadImages()}),fillRestaurantHoursHTML=((e=self.restaurant.operating_hours)=>{const t=document.getElementById("restaurant-hours");for(let n in e){const a=document.createElement("tr"),r=document.createElement("td");r.innerHTML=n,a.appendChild(r);const l=document.createElement("td");l.innerHTML=e[n],a.appendChild(l),t.appendChild(a)}}),fillReviewsHTML=(e=>{const t=document.getElementById("reviews-container"),n=document.createElement("h2");if(n.innerHTML="Reviews",t.appendChild(n),!e){const e=document.createElement("p");return e.innerHTML="No reviews yet!",void t.appendChild(e)}const a=document.getElementById("reviews-list");e.forEach(e=>{a.appendChild(createReviewHTML(e))}),t.appendChild(a)}),createReviewHTML=(e=>{const t=document.createElement("li"),n=document.createElement("article");t.appendChild(n);const a=document.createElement("header");a.className="review-title",n.appendChild(a);const r=document.createElement("p");r.innerHTML=e.name,a.appendChild(r);const l=new Date(e.createdAt),s=document.createElement("p");s.innerHTML=l.getDay()+"-"+l.getMonth()+"-"+l.getFullYear(),a.appendChild(s);const i=document.createElement("div");a.appendChild(i);const c=document.createElement("div");c.className="review-content",n.appendChild(c);const o=document.createElement("p");o.innerHTML=`Rating: ${e.rating}`,o.className="review-rating",c.appendChild(o);const d=document.createElement("p");return d.innerHTML=e.comments,c.appendChild(d),t}),fillBreadcrumb=((e=self.restaurant)=>{const t=document.getElementById("breadcrumb"),n=document.createElement("li");n.innerHTML=e.name,t.appendChild(n)}),getParameterByName=((e,t)=>{t||(t=window.location.href),e=e.replace(/[\[\]]/g,"\\$&");const n=new RegExp(`[?&]${e}(=([^&#]*)|&|#|$)`).exec(t);return n?n[2]?decodeURIComponent(n[2].replace(/\+/g," ")):"":null}),fetchReviews=(()=>{const e=getParameterByName("id");e?DBHelper.fetchReviewsByRestaurantId(e,(e,t)=>{e||fillReviewsHTML(t)}):(error="No restaurant id in URL",callback(error,null))});class DBHelper{static get DATABASE_URL(){return{restaurants:"http://localhost:1337/restaurants",reviews:"http://localhost:1337/reviews"}}static fetchRestaurants(e){return fetch(DBHelper.DATABASE_URL.restaurants).then(t=>{t.json().then(t=>{e(null,t)})}).catch(e=>{console.log(e)})}static fetchRestaurantById(e,t){return fetch(`${DBHelper.DATABASE_URL.restaurants}/${e}`).then(e=>{e.json().then(e=>{t(null,e)})}).catch(e=>{console.log(e)})}static fetchRestaurantByCuisine(e,t){DBHelper.fetchRestaurants((n,a)=>{if(n)t(n,null);else{const n=a.filter(t=>t.cuisine_type==e);t(null,n)}})}static fetchRestaurantByNeighborhood(e,t){DBHelper.fetchRestaurants((n,a)=>{if(n)t(n,null);else{const n=a.filter(t=>t.neighborhood==e);t(null,n)}})}static fetchRestaurantByCuisineAndNeighborhood(e,t,n){DBHelper.fetchRestaurants((a,r)=>{if(a)n(a,null);else{let a=r;"all"!=e&&(a=a.filter(t=>t.cuisine_type==e)),"all"!=t&&(a=a.filter(e=>e.neighborhood==t)),n(null,a)}})}static fetchNeighborhoods(e){DBHelper.fetchRestaurants((t,n)=>{if(t)e(t,null);else{const t=n.map((e,t)=>n[t].neighborhood),a=t.filter((e,n)=>t.indexOf(e)==n);e(null,a)}})}static fetchCuisines(e){DBHelper.fetchRestaurants((t,n)=>{if(t)e(t,null);else{const t=n.map((e,t)=>n[t].cuisine_type),a=t.filter((e,n)=>t.indexOf(e)==n);e(null,a)}})}static urlForRestaurant(e){return`./restaurant.html?id=${e.id}`}static imageUrlForRestaurant(e){if(e.photograph)return`/responsive_images/${e.photograph}.jpg`}static mapMarkerForRestaurant(e,t){return new google.maps.Marker({position:e.latlng,title:e.name,url:DBHelper.urlForRestaurant(e),map:t,animation:google.maps.Animation.DROP})}static fetchReviews(e){return fetch(DBHelper.DATABASE_URL.reviews).then(t=>{t.json().then(t=>{e(null,t)})}).catch(e=>{console.log(e)})}static fetchReviewsByRestaurantId(e,t){return fetch(`${DBHelper.DATABASE_URL.reviews}/?restaurant_id=${e}`).then(e=>{e.json().then(e=>{console.log(e),t(null,e)})}).catch(e=>{console.log(e)})}static postData(e,t){return fetch(e,{body:JSON.stringify(t),cache:"no-cache",headers:{"content-type":"application/json"},method:"POST"}).then(e=>e.json())}}