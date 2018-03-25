import DBHelper from "./dbhelper";

/**
 * Common database helper functions.
 */
export default class PictureHelper {
    static getPictureElement(restaurant) {
        const picture = document.createElement('picture');
        picture.className = 'restaurant-img';
        const imgName= restaurant.photograph.split('.').shift();

        picture.append(PictureHelper.getSourceForPicture('large', imgName, 'webp'));
        picture.append(PictureHelper.getSourceForPicture('large', imgName, 'jpg'));
        picture.append(PictureHelper.getSourceForPicture('medium', imgName, 'webp'));
        picture.append(PictureHelper.getSourceForPicture('medium', imgName, 'jpg'));
        picture.append(PictureHelper.getSourceForPicture(null, imgName, 'webp'));

        const image = document.createElement('img');
        image.className = 'restaurant-img';
        image.src = DBHelper.imageUrlForRestaurant(restaurant);
        image.alt = restaurant.name;
        picture.append(image);

        return picture;
    };

    static getSourceForPicture(breakpoint, imgName, type) {
        let minWidth,
            imgSuffix = `-${breakpoint}`;
        switch (breakpoint){
            case 'large':
                minWidth = 800;
                break;
            case 'medium':
                minWidth = 640;
                break;
            default:
                imgSuffix = '';
        }

        const source = document.createElement('source');
        source.media = breakpoint ? `(min-width: ${minWidth}px)` : '';
        source.srcset = `/img/${imgName}${imgSuffix}.${type}`;
        source.type =  type === 'jpg' ? `image/jpeg` : `image/${type}`;

        return source;
    };

}
