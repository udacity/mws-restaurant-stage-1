//stores a reference to the indexedDB database
let _db;

var dbPromise = idb.open('mws-db', 1, function(upgradeDb) {
	switch(upgradeDb.oldVersion) {
		case 0:
			var store = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
	}
}).then(function(database) {
	if(!database) return;
	_db = database;
});

