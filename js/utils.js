const dbPromise = idb.open("restaurants-store", 1, db => {
  // create the restaurants table if it doesn't exist
  if (!db.objectStoreNames.contains("restaurants")) {
    console.log("Creating Object Store Restaurant");
    db.createObjectStore("restaurants", { keyPath: "id" });
  }
});

function writeItem(storeName, item) {
  console.log("writeItem", storeName, item);
  return dbPromise.then(db => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.put(item);
    return tx.complete;
  });
}
function getItems(storeName) {
  console.log("getItems", storeName);
  return dbPromise.then(db => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    return store.getAll();
  });
}

function getItem(storeName, id) {
  console.log("getItem", storeName, id);
  return dbPromise.then(db => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    return store.get(id);
  });
}
function deleteItems(storeName) {
  console.log("deleteItems", storeName);
  return dbPromise.then(db => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.clear();
    return tx.complete;
  });
}

function deleteItem(storeName, id) {
  console.log("deleteItem", storeName, id);
  return dbPromise
    .then(db => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.delete(id);
      return tx.complete;
    })
    .then(() => console.log(`Item ${id} deleted`));
}
