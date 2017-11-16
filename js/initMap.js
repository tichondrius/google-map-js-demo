 function initMap() {
  // Create a map object and specify the DOM element for display.
  window.map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 10.7626825, lng: 106.6803805 }, // địa điểm trường mình
    zoom: 15
  });
  window.directionsService = new google.maps.DirectionsService;
  window.directionsDisplay= new google.maps.DirectionsRenderer;
  window.geoCoder = new google.maps.Geocoder();
}