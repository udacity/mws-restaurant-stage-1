export const getSelectedCuisineAndNeighborhood = () => {
  const cSelect = document.getElementById("cuisines-select");
  const nSelect = document.getElementById("neighborhoods-select");
  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;
  const cuisine = cSelect[cIndex].value || "all";
  const neighborhood = nSelect[nIndex].value || "all";
  return { cuisine, neighborhood };
};
