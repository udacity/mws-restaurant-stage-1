module.exports = {
    "env": {
        "node": true,
        "browser": true,
        "es6": true,
        "amd": true,
        "serviceworker": true,
        "webextensions": true,
    },
    "globals": {
        "google": true,
        "DBHelper": true,
    },
    "rules": {
        "no-console": 0,
        "no-useless-escape": 0,
    },
    "extends": "eslint:recommended"
};