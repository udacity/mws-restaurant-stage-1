import * as idb from "idb";

const dbPromise = idb.open("restaurants-store", 1, db => {
  // create the restaurants table if it doesn't exist
  if (!db.objectStoreNames.contains("restaurants")) {
    console.log("Creating Object Store Restaurant");
    db.createObjectStore("restaurants", { keyPath: "id" });
  }
});

export function writeItem(storeName, item) {
  // console.log("writeItem", storeName, item);
  return dbPromise.then(db => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.put(item);
    return tx.complete;
  });
}

export function getItems(storeName) {
  return dbPromise.then(db => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    return store.getAll();
  });
}

export function getItem(storeName, id) {
  // console.log("getItem", storeName, id);
  return dbPromise.then(db => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    return store.get(id);
  });
}

export function deleteItems(storeName) {
  // console.log("deleteItems", storeName);
  return dbPromise.then(db => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.clear();
    return tx.complete;
  });
}

export function deleteItem(storeName, id) {
  // console.log("deleteItem", storeName, id);
  return dbPromise
    .then(db => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.delete(id);
      return tx.complete;
    })
    .then(() => console.log(`Item ${id} deleted`));
}
