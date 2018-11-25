var modal = document.getElementById('myModal');
var btn = document.getElementById("new-review-button");
var btnSave = document.getElementById("btnSave");
var dateValue = document.getElementById("date");
dateValue.value = new Date().toDateString();


btn.onclick = function() {
    modal.style.display = "block";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

btnSave.onclick= function(event) {
    // if (event.target == modal) {
        modal.style.display = "none";
    // }
    if(modal.hasChildNodes) {
        var review = {name: '',    createdAt:'',    updatedAt:'',
            comments:'', restaurant_id:''}
        var arr = modal.childNodes[1].getElementsByClassName("close");
        review.restaurant_id = document.getElementById('restaurant-id').value;
        for ( var i=0; i< arr.length; i++)
        {
            if( arr[i].id == "name")
            review.name = arr[i].value;
            if( arr[i].id == "date")
            {
                review.createdAt = arr[i].value;
                review.updatedAt = arr[i].value;
            } 
            if( arr[i].id == "rating")
            review.rating = arr[i].value;
            if( arr[i].id == "comments")
            review.comments = arr[i].value;
        }
        console.log(JSON.stringify(review));
        DBHelper.addNewReviewToLocalDatabase(review);
        addNewReview(review);
        if(navigator.onLine)
            DBHelper.addNewReviewOnServer(restaurant,review);          
           //postReviewToServer(review);
        else 
            DBHelper.addRequestsToQueue(restaurant, review);

    }
}


function myFunc()  {
    var span = event.target.closest('span');
    document.getElementById('rating').value = span.getAttribute('value');

}