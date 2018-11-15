var modal = document.getElementById('myModal');
var btn = document.getElementById("new-review-button");
var btnSave = document.getElementById("btnSave");


btn.onclick = function() {
    modal.style.display = "block";
}

// span.onclick = function() {
//     modal.style.display = "none";
// }

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
}
