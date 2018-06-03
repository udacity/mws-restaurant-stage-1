import * as idb from "idb";

const dbPromise = idb.open("restaurants-store", 2, db => {
  // create the restaurants table if it doesn't exist
  if (!db.objectStoreNames.contains("restaurants")) {
    console.log("Creating Object Store - restaurants");
    db.createObjectStore("restaurants", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("reviews")) {
    console.log("Creating Object Store - reviews");
    db.createObjectStore("reviews", { keyPath: "id" });
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
  const validID = typeof id === "number" ? id : Number(id);
  return dbPromise.then(db =>
    db
      .transaction(storeName, "readonly")
      .objectStore(storeName)
      .get(validID)
  );
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
