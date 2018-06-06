import * as idb from "idb";

const dbPromise = idb.open("restaurants-store", 6, db => {
  // create the restaurants table if it doesn't exist
  if (!db.objectStoreNames.contains("restaurants")) {
    console.log("Creating Object Store - restaurants");
    db.createObjectStore("restaurants", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("reviews")) {
    console.log("Creating Object Store - reviews");
    db.createObjectStore("reviews", { keyPath: "id" });
  }
  // create an object store to cache outgoing review submissions
  if (!db.objectStoreNames.contains("sync-reviews")) {
    db.createObjectStore("sync-reviews", {
      keyPath: ["name", "restaurant_id"]
    });
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

// For some reason, the Sails backend returns inconsistent data
export function sanitizeReview(review) {
  return {
    id: Number(review.id),
    name: String(review.name),
    rating: Number(review.rating),
    restaurant_id: Number(review.restaurant_id),
    comments: String(review.comments),
    createdAt: Date.parse(review.createdAt),
    updatedAt: Date.parse(review.updatedAt)
  };
}
