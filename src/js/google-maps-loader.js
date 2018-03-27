export default class GoogleMapsLoader {
    /**
     * @description Add script element to page and loads GoogleMap Api
     * @constructor
     * @param {string} async - flag to set async loading
     * @param {string} defer - flag to set defer
     */
    constructor(async = true, defer = true) {
        this.language = 'en';
        this.region = 'US';
        this.initializator = '__google_maps_api_provider_initializator__';
        this.mapApiUrl = 'https://maps.googleapis.com/maps/api/js';
        this.libraries = [];
        this.businessApi = null;
        this.key = null;
        this.version = '3.27';
        this.mapId = 'map';
        this.mapOptions = {
            zoom: 12,
            center: {
                lat: 40.722216,
                lng: -73.987501
            },
            scrollwheel: false,
        };

        this.isAsync = async;
        this.isDefer = defer;
        this.google = null;
        this.loading = false;
        this.callbacks = [];
        this.scriptElement = null;
        this.onLoadEvents = [];
    }

    static get REGION() {
        return this.region;
    }

    static set REGION(region) {
        this.region = region;
    }

    get LIBRARIES() {
        return this.libraries;
    }

    set LIBRARIES(libs) {
        this.libraries = libs;
    }

    get BUSINESS_API() {
        return this.businessApi;
    }

    set BUSINESS_API(key) {
        this.businessApi = key;
    }

    get KEY() {
        return this.key;
    }

    set KEY(key) {
        this.key = key;
    }

    get VERSION() {
        return this.version;
    }

    set VERSION(version) {
        this.version = version;
    }

    get LANGUAGE() {
        return this.language;
    }

    set LANGUAGE(language) {
        this.language = language;
    }

    /**
     * @description Loads Google Map Api
     * @param {function} onLoadCallback - callback after loading
     * @param {object} mapOptions - map settings
     * @param {string} mapId - id of div where maps is appended
     * @returns {void}
     */
    load(onLoadCallback, mapOptions, mapId) {
        this.mapOptions = mapOptions || this.mapOptions;
        this.mapId = mapId || this.mapId;

        if (this.google === null) {
            if (this.loading === true) {
                if (onLoadCallback) {
                    this.callbacks.push(onLoadCallback);
                }
            } else {
                this.loading = true;
                let that = this;
                window[this.initializator] = function () {
                    that.ready(onLoadCallback);
                };

                this.appendLoaderToBody();
            }
        } else if (onLoadCallback) {
            onLoadCallback(this.google);
        }
    }

    /**
     * @description onLoad-Handler
     * @param {function} callback - callback after loading
     * @returns {void}
     */
    onLoad(callback) {
        this.onLoadEvents.push(callback);
    }

    /**
     * @description Adds script tag for loading
     * @returns {void}
     */
    appendLoaderToBody() {
        this.scriptElement = document.createElement('script');
        this.scriptElement.src = this.createUrl();
        if (this.isAsync) this.scriptElement.async = true; // not needed as async is set by default
        if (this.isDefer) this.scriptElement.defer = true;
        document.body.appendChild(this.scriptElement);
    }

    /**
     * @description Creates GoogleMapApi URL for script
     * @returns {string}
     */
    createUrl() {
        let url = this.mapApiUrl;
        url += '?callback=' + this.initializator;
        url += `&key=${this.key}`;

        if (this.libraries.length > 0) {
            url += '&_libraries=' + this.libraries.join(',');
        }

        if (this.businessApi) {
            url += '&client=' + this.businessApi + '&v=' + this.version;
        }

        if (this.language) {
            url += '&_language=' + this.language;
        }

        if (this.region) {
            url += '&_region=' + this.region;
        }

        return url;
    }

    /**
     * @description onReady-Handler
     * @param {function} callback - fires when map is appended
     * @returns {void}
     */
    ready(callback) {
        this.loading = false;

        if (this.google === null) {
            this.google = window.google;
        }

        let map = this.createMap();

        for (let i = 0; i < this.onLoadEvents.length; i++) {
            this.onLoadEvents[i](map);
        }

        if (callback) {
            callback(map);
        }

        for (let i = 0; i < this.callbacks.length; i++) {
            this.callbacks[i](map);
        }

        this.callbacks = [];
    }

    /**
     * @description Creates new GoogleMap
     * @returns {Map}
     */
    createMap() {
        const map = document.getElementById(this.mapId);
        map.style.display = 'block';

       return new this.google.maps.Map(map, this.mapOptions);
    }

    // TODO: think about garbage collection (inspired from google-maps npm)
    /*
    GoogleMapsLoader.release = function(fn) {
		var release = function() {
			GoogleMapsLoader.KEY = null;
			GoogleMapsLoader.LIBRARIES = [];
			GoogleMapsLoader.CLIENT = null;
			GoogleMapsLoader.CHANNEL = null;
			GoogleMapsLoader.LANGUAGE = null;
			GoogleMapsLoader.REGION = null;
			GoogleMapsLoader.VERSION = googleVersion;

			google = null;
			loading = false;
			callbacks = [];
			onLoadEvents = [];

			if (typeof window.google !== 'undefined') {
				delete window.google;
			}

			if (typeof window[GoogleMapsLoader.WINDOW_CALLBACK_NAME] !== 'undefined') {
				delete window[GoogleMapsLoader.WINDOW_CALLBACK_NAME];
			}

			if (originalCreateLoaderMethod !== null) {
				GoogleMapsLoader.createLoader = originalCreateLoaderMethod;
				originalCreateLoaderMethod = null;
			}

			if (script !== null) {
				script.parentElement.removeChild(script);
				script = null;
			}

			if (fn) {
				fn();
			}
		};

		if (loading) {
			GoogleMapsLoader.load(function() {
				release();
			});
		} else {
			release();
		}
	};

     */
}