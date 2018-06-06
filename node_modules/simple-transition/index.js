module.exports = function transition(el, obj, duration, easing) {
  return new Promise(function(resolve, reject) {
    if (obj.transform) {
      obj['-webkit-transform'] = obj.transform;
    }

    var objKeys = Object.keys(obj);

    if (duration) {
      el.style.transitionProperty = objKeys.join();
      if (easing) el.style.transitionTimingFunction = easing;
      el.style.transitionDuration = duration + 's';
      el.offsetLeft; // style recalc

      el.addEventListener('transitionend', function te() {
        el.style.transitionProperty = '';
        el.style.transitionTimingFunction = '';
        el.style.transitionDuration = '';
        resolve();
        el.removeEventListener('transitionend', te);
      });
    }
    else {
      resolve();
    }

    objKeys.forEach(function(key) {
      el.style.setProperty(key, obj[key]);
    });
  });
};
