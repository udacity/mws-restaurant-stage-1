
export default class LazyImgs {

  constructor(imgSelector){
    const options = {
      rootMargin: '0px',
      threshold: 0.1
    };
    this.observer = new IntersectionObserver(this.callback, options);
    this.observeImages(document.querySelectorAll(imgSelector));
  }

  observeImages(imgs) {
    imgs.forEach((img) => {
      this.observer.observe(img);
    });
  }

  callback(entries, observer) {
    entries.forEach((entry) => {
      if (entry.intersectionRatio > 0) {
        LazyImgs.loadImage(entry.target);
        // stop observing this image
        observer.unobserve(entry.target);
      }
    });
  }

  static loadImage(image) {
    const src = image.dataset.src;
    LazyImgs.fetchImage(src).then(() => {
      image.src = src;
    });
  }

  static fetchImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = url;
      image.onload = resolve;
      image.onerror = reject;
    });
  }
}