const app = angular.module('googleMap', []);




app.controller('MapController', function MapController($scope) {
  // Khởi tạo state của app
  $scope.locations = [];
  $scope.locationMakers = [];
  $scope.currentLocationMaker = null;
  $scope.activeLocationId = -1;
  $scope.searchValue = '';


  // Xử lý sự kiện click vào nút load location
  $scope.loadLocation = () => {
    // Load  địa điểm
    $scope.locations = loadLocations();
    // Pin marker ứng với mỗi địa điểm vào map
    $scope.locationMakers = createLocationsMakers($scope.locations);
    // Lấy vị trí hiện tại và tạo maker cho nó
    const currentLocation = getCurrentLocation();
    $scope.setNewCurrentLocation(currentLocation);
    
    
  }
  // Xử lý xự kiện click vào location item
  $scope.clickLocation = (location) => {
    $scope.closeAllInfoWindow();
    // Tìm maker tương tứng, và show thông tin bên map
    const locationMaker = $scope.locationMakers.find(maker => maker.location.id === location.id);
    if (locationMaker) {
      locationMaker.openInfoWindow();
    }
    $scope.activeLocationId = location.id;
  }

  $scope.closeAllInfoWindow = () => {
    if ($scope.locationMakers) {
      $scope.locationMakers.forEach(maker => {
        maker.closeInfoWindow();
      })
    }
  }
  $scope.setNewCurrentLocation = (location) => {
    if ($scope.currentLocationMaker) {
      $scope.currentLocationMaker.setMap(null);
      $scope.currentLocationMaker.closeInfoWindow();
    }
    $scope.currentLocation = location;
    $scope.currentLocation.type = 'MY_LOCATION';
    window.map.setCenter(new google.maps.LatLng(location.location.lat, location.location.lng));
    $scope.currentLocationMaker = createMaker($scope.currentLocation);
    
  }
  
  $scope.searchLocation = () => {
    const address = $scope.searchValue;
    codeAddress(address).then((location) => {
      // Thay thế location hiện tại với location tìm được
      $scope.$apply(() => {
        $scope.setNewCurrentLocation(location);
      })
      
    }).catch(error => {
      alert('Không tìm thấy địa điểm muốn tìm');
    });
  }
  $scope.searchByCoor = () => {
    if ($scope.currentLocation) {
      const { lat, lng } = $scope.currentLocation.location;
      geocodeLatLng({ lat: lat.toString(), lng: lng.toString()}).then(location => {
        $scope.$apply(() => {
          $scope.setNewCurrentLocation(location);
        })
      }).catch(error => {
        alert('Không tìm thấy địa điểm muốn tìm');
      })

    }
  }

  
  // Xử lý sự kiện click vào nút chỉ đường locaton item
  $scope.directionLocation = (location) => {
    const { directionsDisplay, directionsService } = window;
    window.directionsDisplay.setMap(null);
    window.directionsDisplay.setPanel(document.getElementById('text-directions'));
    window.directionsDisplay.setMap(window.map);
    window.directionsService.route({
      origin: $scope.currentLocation.location, // Điểm đi là vị trí hiện tại
      destination: location.location, // Điểm đến là vị trí đã được click
      travelMode: 'DRIVING',
    }, function(response, status) {
      if (status === 'OK') {
        directionsDisplay.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
  };
});




// Reverse geocoding 1 toạ độ
const geocodeLatLng = ({ lat, lng}) => new Promise((resolve, reject) => {

  var latlng = {lat: parseFloat(lat), lng: parseFloat(lng)};
  window.geoCoder.geocode({'location': latlng}, function(results, status) {
    if (status === 'OK') {
      if (Array.isArray(results) && results.length > 0) {
        const result = results[0];
        resolve({
          name: result.formatted_address,
          location: {
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
          }
        });
      }
    }
    reject('NOT_FOUND')
  });
});


// Geocoding 1 địa chỉ
const codeAddress = (address) => new Promise((resolve, reject) => {
  window.geoCoder.geocode({
    address,
  }, (results, status) => {
    // Lấy kết quả đầu tiên
    if (status === 'OK') {
      if (Array.isArray(results) && results.length > 0) {
        const result = results[0];
        resolve({
          name: result.formatted_address,
          location: {
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
          }
        });
      }
    }
    reject('NOT_FOUND');
  });
});

// Tạp maker từ các location
const createLocationsMakers = locations => {
  const makers = [];
  locations.forEach((location) => {
    const maker = createMaker(location);
    makers.push(maker)
  });
  return makers;
}


// Thêm event cho maker
const addEventForMaker = (maker) => {
  const infoWindow = new google.maps.InfoWindow({
    content: makeContentForMaker(maker.location),
  })
  maker.addListener('click', () => {
    infoWindow.open(maker.getMap(), maker);
  });
  maker.openInfoWindow = () => {
    infoWindow.open(maker.getMap(), maker);
  }
  maker.closeInfoWindow = () => {
    infoWindow.close();
  }
}


const makeContentForMaker = (location) => {
  return `
    <div class="map-location-container">
      <h4>${location.name}</h4>
      ${ location.image ? `<img src="images/${location.image}"></img>` : ''}
    </div>
  `
}

const createMaker = location => {
  let maker;
  if (location.type !== 'MY_LOCATION') {
    maker = new google.maps.Marker({
      position: location.location,
      map: window.map,
      icon: `/images/${location.type}.png`, // Image icon muốn sử dụng
      animation: google.maps.Animation.DROP, // Animation muốn dùng
    });
    maker.location = location;
  }
  else { // Location hiện tại thì set icon maker mặc định
    maker = new google.maps.Marker({
      position: location.location,
      map: window.map,
      animation: google.maps.Animation.DROP, // Animation muốn dùng
    });
    maker.location = location;
    
  }
  addEventForMaker(maker)
  return maker
}




const getCurrentLocation = () => ({
  name: 'Tôi là ai, đây là đâu...',
  location: {
    lat: 10.7598329,
    lng: 106.6836861,
  },
  type: 'MY_LOCATION',
});

const loadLocations = () => [
  {
    id: '1',
    name: 'Majestic Saigon',
    location: {
      lat: 10.7626825, lng: 106.6803805
    },
    desc: 'Mô tả tùm lum',
    image: '1.jpg',
    type: 'HOTEL'
  },
  {
    id: '2',
    name: 'Alagon',
    location: {
      lat: 10.7646429, lng: 106.680638
    },
    desc: 'Mô tả gì đó',
    image: '2.jpeg',
    type: 'HOTEL'
  },
  {
    id: '3',
    name: 'Nikko Saigon',
    location: {
      lat: 10.7658129, lng: 106.679254
    },
    desc: 'Có miêu tả là được',
    image: '3.jpeg',
    type: 'MOTEL'
  },
  {
    id: '4',
    name: 'Sen Saigon',
    location: {
      lat: 10.7658129, lng: 106.669254
    },
    desc: 'Cạn lời',
    image: '4.jpeg',
    type: 'MOTEL'
  },
] 
