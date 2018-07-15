class jsHelper{static lazyLoadImages(){Array.from(document.getElementsByTagName("picture")).forEach(e=>{if(this.isInViewport(e)){var t=Array.from(e.getElementsByTagName("source"));t.forEach(e=>{e.getAttribute("srcset")||e.setAttribute("srcset",e.getAttribute("data-srcset"))}),Array.from(e.getElementsByTagName("img")).forEach(e=>{e.getAttribute("src")||e.setAttribute("src",e.getAttribute("data-src")),e.addEventListener("load",()=>{e.removeAttribute("data-src"),t.forEach(e=>{e.removeAttribute("data-srcset")})})})}})}static isInViewport(e){var t=e.getBoundingClientRect();return t.top>=0&&t.left>=0&&t.bottom<=(window.innerHeight||document.documentElement.clientHeight)&&t.right<=(window.innerWidth||document.documentElement.clientWidth)}static getParameterByName(e,t){t||(t=window.location.href),e=e.replace(/[\[\]]/g,"\\$&");const n=new RegExp(`[?&]${e}(=([^&#]*)|&|#|$)`).exec(t);return n?n[2]?decodeURIComponent(n[2].replace(/\+/g," ")):"":null}static getFormValues(){return{name:document.getElementById("name").value,rating:document.getElementById("rating").value,comments:document.getElementById("comments").value,restaurant_id:this.getParameterByName("id")}}static serializeObject(e){return Object.keys(e).map(t=>t+"="+e[t]).join("&")}}let restaurant,reviews;var map;window.addEventListener("load",function(){navigator.serviceWorker&&navigator.serviceWorker.register("/sw.js",{scope:"/"}).then(()=>{console.log("Registration successfull")}).catch(()=>{console.log("SW Registration failed")})}),document.addEventListener("DOMContentLoaded",()=>{document.getElementById("submit-review").addEventListener("click",e=>{e.preventDefault(),DBHelper.submitReview(()=>{})})}),window.initMap=(()=>{fetchRestaurantFromURL((e,t)=>{if(e)console.error(e);else{try{self.map=new google.maps.Map(document.getElementById("map"),{zoom:16,center:t.latlng,scrollwheel:!1})}catch(e){console.log("Load of google map failed")}document.getElementById("map").style.display="block",fillBreadcrumb(),DBHelper.mapMarkerForRestaurant(self.restaurant,self.map)}})}),fetchRestaurantFromURL=(e=>{if(self.restaurant)return void e(null,self.restaurant);const t=jsHelper.getParameterByName("id");t?DBHelper.fetchRestaurantById(t,(t,n)=>{self.restaurant=n,n?(fillRestaurantHTML(),e(null,n)):console.error(t)}):(error="No restaurant id in URL",e(error,null))}),fillRestaurantHTML=((e=self.restaurant)=>{document.getElementById("restaurant-name").innerHTML=e.name,document.getElementById("restaurant-address").innerHTML=e.address;const t=document.getElementById("restaurant-img");if(DBHelper.imageUrlForRestaurant(e)){let n=document.createElement("picture");n.className="restaurant-img-available lazy-loading",t.prepend(n);const r=DBHelper.imageUrlForRestaurant(e).replace(".jpg","");let a=document.createElement("source");a.setAttribute("data-srcset",`${r}-800_large_1x.jpg 1x,${r}-800_large_2x.jpg 2x`),a.media="(min-width: 1400px)",n.appendChild(a),(a=document.createElement("source")).setAttribute("data-srcset",`${r}-400_small_1x.jpg 1x,${r}-400_small_2x.jpg 2x`),a.media="(max-width: 400px)",n.appendChild(a),(a=document.createElement("source")).setAttribute("data-srcset",`${r}-400_small_1x.jpg 1x,${r}-400_small_2x.jpg 2x`),a.media="(min-width: 1000px) and (max-width: 1399px)",n.appendChild(a),(a=document.createElement("source")).setAttribute("data-srcset",`${r}-800_large_1x.jpg 1x,${r}-800_large_2x.jpg 2x`),a.media="(min-width: 401px) and (max-width: 999px)",n.appendChild(a);const l=document.createElement("img");l.alt=`${e.name} Restaurant`,l.setAttribute("data-src",`${r}-400_small_1x.jpg`),n.appendChild(l)}else{let e=document.createElement("p");e.className="restaurant-img-not-available",e.innerHTML="Image not Available",t.prepend(e)}document.getElementById("restaurant-cuisine").innerHTML=e.cuisine_type,document.getElementById("restaurant_id").setAttribute("value",jsHelper.getParameterByName("id")),document.getElementById("review-form").setAttribute("action",DBHelper.DATABASE_URL.reviews),e.operating_hours&&fillRestaurantHoursHTML(),fetchReviews(),jsHelper.lazyLoadImages()}),fillRestaurantHoursHTML=((e=self.restaurant.operating_hours)=>{const t=document.getElementById("restaurant-hours");for(let n in e){const r=document.createElement("tr"),a=document.createElement("td");a.innerHTML=n,r.appendChild(a);const l=document.createElement("td");l.innerHTML=e[n],r.appendChild(l),t.appendChild(r)}}),fillReviewsHTML=(e=>{const t=document.getElementById("reviews-container"),n=document.createElement("h2");if(n.innerHTML="Reviews",t.appendChild(n),!e){const e=document.createElement("p");return e.innerHTML="No reviews yet!",void t.appendChild(e)}const r=document.getElementById("reviews-list");e.forEach(e=>{r.appendChild(createReviewHTML(e))}),t.appendChild(r)}),createReviewHTML=(e=>{const t=document.createElement("li"),n=document.createElement("article");t.appendChild(n);const r=document.createElement("header");r.className="review-title",n.appendChild(r);const a=document.createElement("p");a.innerHTML=e.name,r.appendChild(a);const l=new Date(e.createdAt),s=document.createElement("p");s.innerHTML=l.getDay()+"-"+l.getMonth()+"-"+l.getFullYear(),r.appendChild(s);const i=document.createElement("div");r.appendChild(i);const o=document.createElement("div");o.className="review-content",n.appendChild(o);const c=document.createElement("p");c.innerHTML=`Rating: ${e.rating}`,c.className="review-rating",o.appendChild(c);const d=document.createElement("p");return d.innerHTML=e.comments,o.appendChild(d),t}),fillBreadcrumb=((e=self.restaurant)=>{const t=document.getElementById("breadcrumb"),n=document.createElement("li");n.innerHTML=e.name,t.appendChild(n)}),fetchReviews=(()=>{const e=jsHelper.getParameterByName("id");e?DBHelper.fetchReviewsByRestaurantId(e,(e,t)=>{e||fillReviewsHTML(t)}):(error="No restaurant id in URL",callback(error,null))});class DBHelper{static get DATABASE_URL(){return{restaurants:"http://localhost:1337/restaurants",reviews:"http://localhost:1337/reviews"}}static fetchRestaurants(e){return fetch(DBHelper.DATABASE_URL.restaurants).then(t=>{t.json().then(t=>{e(null,t)})}).catch(e=>{console.log(e)})}static fetchRestaurantById(e,t){return fetch(`${DBHelper.DATABASE_URL.restaurants}/${e}`).then(e=>{e.json().then(e=>{t(null,e)})}).catch(e=>{console.log(e)})}static fetchRestaurantByCuisine(e,t){DBHelper.fetchRestaurants((n,r)=>{if(n)t(n,null);else{const n=r.filter(t=>t.cuisine_type==e);t(null,n)}})}static fetchRestaurantByNeighborhood(e,t){DBHelper.fetchRestaurants((n,r)=>{if(n)t(n,null);else{const n=r.filter(t=>t.neighborhood==e);t(null,n)}})}static fetchRestaurantByCuisineAndNeighborhood(e,t,n){DBHelper.fetchRestaurants((r,a)=>{if(r)n(r,null);else{let r=a;"all"!=e&&(r=r.filter(t=>t.cuisine_type==e)),"all"!=t&&(r=r.filter(e=>e.neighborhood==t)),n(null,r)}})}static fetchNeighborhoods(e){DBHelper.fetchRestaurants((t,n)=>{if(t)e(t,null);else{const t=n.map((e,t)=>n[t].neighborhood),r=t.filter((e,n)=>t.indexOf(e)==n);e(null,r)}})}static fetchCuisines(e){DBHelper.fetchRestaurants((t,n)=>{if(t)e(t,null);else{const t=n.map((e,t)=>n[t].cuisine_type),r=t.filter((e,n)=>t.indexOf(e)==n);e(null,r)}})}static urlForRestaurant(e){return`./restaurant.html?id=${e.id}`}static imageUrlForRestaurant(e){if(e.photograph)return`/responsive_images/${e.photograph}.jpg`}static mapMarkerForRestaurant(e,t){return new google.maps.Marker({position:e.latlng,title:e.name,url:DBHelper.urlForRestaurant(e),map:t,animation:google.maps.Animation.DROP})}static fetchReviews(e){return fetch(DBHelper.DATABASE_URL.reviews).then(t=>{t.json().then(t=>{e(null,t)})}).catch(e=>{console.log(e)})}static fetchReviewsByRestaurantId(e,t){return fetch(`${DBHelper.DATABASE_URL.reviews}/?restaurant_id=${e}`).then(e=>{e.json().then(e=>{t(null,e)})}).catch(e=>{console.log(e)})}static submitReview(e){return fetch(DBHelper.DATABASE_URL.reviews,{headers:{Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",Connection:"keep-alive","Content-Length":`${jsHelper.serializeObject(jsHelper.getFormValues()).length}`,"Content-Type":"application/x-www-form-urlencoded"},method:"post",body:jsHelper.serializeObject(jsHelper.getFormValues())}).then(function(e){return console.log(e),e.json()}).then(function(t){console.log(t),e(t)}).catch(e=>{"SyncManager"in window?navigator.serviceWorker.ready.then(e=>(console.log("Sw ready"),e.pushManager.getSubscription())).then(e=>{navigator.serviceWorker.controller.postMessage({url:DBHelper.DATABASE_URL.reviews,formData:jsHelper.getFormValues(),type:"new-review",method:"POST"})}).catch(e=>{console.log(e)}):console.log(e)})}}