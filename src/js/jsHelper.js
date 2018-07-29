class jsHelper {

/**
   * Lazy loads pictures so app can be faster
   */
  static lazyLoadImages() {

    var pictures = Array.from(document.getElementsByTagName('picture'));

    pictures.forEach(picture => {

      if(this.isInViewport(picture)) {

        var sources = Array.from(picture.getElementsByTagName('source'));

        sources.forEach(source => {
          if(!source.getAttribute('srcset')) {
            source.setAttribute('srcset', source.getAttribute('data-srcset'));
          }
        });

        var images = Array.from(picture.getElementsByTagName('img'));

        images.forEach(img => {
          
          if(!img.getAttribute('src')) {
            img.setAttribute('src', img.getAttribute('data-src'));
          }
          
          img.addEventListener('load',()=>{
            img.removeAttribute('data-src');

            sources.forEach(source => {
                source.removeAttribute('data-srcset');
            });
          });      
        });   
      }    
    });
  }

  /**
   * Lazy loads map
   */
  static lazyLoadMap() {

    var map_container = document.getElementById('map-container');

    if(this.isInViewport(map_container)) {
      map_container.style.display = "block";
    }
  }

  /**
   * Calculates whether element is present in view port
   * @param {*} elem 
   */
  static isInViewport (elem) {

    var bounding = elem.getBoundingClientRect();

    return (
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  /**
   * Get a parameter by name from page URL.
   */
  static getParameterByName (name, url) {
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

  /**
   * Returns the review form values to be posted
   */
  static getFormValues() {

    return {
      name: document.getElementById('name').value, 
      rating: document.getElementById('rating').value, 
      comments: document.getElementById('comments').value, 
      restaurant_id: this.getParameterByName('id')
    };
  }

  /**
   * Serializes object
   * 
   * @param {*} params 
   */
  static serializeObject(params) {

    return Object.keys(params).map(key => key + '=' + params[key]).join('&');
  }
}