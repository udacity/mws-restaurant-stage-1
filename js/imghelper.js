/**
 * Responsive Image helper functions
 */
class ImgHelper {
    /**
     * Add images to picture element
     */
    static addImages(restaurant, picture, className) {
        const imgSizes = ['large2x', 'large1x', 'medium', 'small']

        imgSizes.forEach(function(size) {
            let img;
            if (size === 'small') {
            img = document.createElement('img');
            img.src = DBHelper.imageUrlForRestaurant(restaurant, size);
            // img.alt = restaurant.photograph.altText;
            } else {
            img = document.createElement('source');
            img.srcset = DBHelper.imageUrlForRestaurant(restaurant, size); 
            img.media = ImgHelper.getImageMediaAttribute(size);
            }
            img.className = className;
            picture.appendChild(img);
        });
    }

    /**
     * Get the right media attribute for image
     */
    static getImageMediaAttribute(size) {
    switch(size) {
        case 'large2x':
        case 'large1x':
        return "(min-width: 750px)";
        case 'medium':
        return "(min-width: 500px)";
        default:
        return "";
    }
    }
}