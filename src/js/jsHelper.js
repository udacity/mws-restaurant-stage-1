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

  static isInViewport (elem) {

    var bounding = elem.getBoundingClientRect();

    return (
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };
}