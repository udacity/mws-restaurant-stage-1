/*
 Save reviews to IDB
*/
saveReview = () => {
  const frm = document.getElementById("reviewDetails");
  const restaurant_Id = getParameterByName('restaurant_id');
  const inputs=frm.elements;
  // const name = inputs["fullName"].value;
  // const rating = inputs["stars"].value;
  // const comments = inputs["comments"].value;
  const name = document.getElementById("fullName").value;
  const btns = document.getElementsByName("stars");
  let rating=0;
  for (var x=0, length = btns.length; x< length; x++) {
    if (btns[x].checked) {
      // console.log('found checked at ', x);
      rating=btns[x].getAttribute("value");
      break;
    }
  }
  // console.log('here are ratings',rating);
  const comments = document.getElementById("comments").value;
  // console.log(restaurant_Id,name,rating,comments);
  // window.alert("name=" + name + " rating " + rating + " comments" + comments);
  DBHelper.addReview(restaurant_Id,name,rating,comments).then(()=>{
    // console.log('made entry returning home');
    window.location.href = "/restaurant.html?id=" + restaurant_Id;
  });
  //window.location.href = "/restaurant.html?id=" + restaurant_Id;
  // return false;
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}