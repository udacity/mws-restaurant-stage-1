class AccessibilityHelper {
    static setTabIndex(){
        console.log("set tab index working");
        // Zoom in button
        document.querySelector(".leaflet-control-zoom-in").setAttribute("tabindex", -1); 
        // Zoom out button
        document.querySelector(".leaflet-control-zoom-out").setAttribute("tabindex", -1);
        // Leaf Text
        document.querySelector(".leaflet-control-attribution a").setAttribute("tabindex", -1);
        
        let marker_list = document.querySelectorAll(".leaflet-marker-icon"); //Map markers
        marker_list.forEach((marker) => {
            //console.log(marker);
            var tabindex_att = document.createAttribute("tabindex");
            tabindex_att.value = -1;
            //console.log("tabindex value", tabindex_att.value); 
            marker.setAttributeNode(tabindex_att);
        });
    }
}