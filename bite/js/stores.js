if (!Date.prototype.toISODate) {
  Date.prototype.toISODate = function() {
    return this.getFullYear() + '-' + ('0'+ (this.getMonth()+1)).slice(-2) + '-' + ('0'+ this.getDate()).slice(-2);
  }
}

function RetailMap () {
  // State
  this.activeMarker = null;
  this.origin = null;
  this.timeList = null;

  // Views
  this.mapContainer = $('.map__container').eq(0);
  this.listContainer = $('.list-view').eq(0);

  // Map panels
  this.sidebar = this.mapContainer.find('.map__sidebar').eq(0);
  this.footer = this.mapContainer.find('.map__footer').eq(0);

  // View controls
  var viewChoice = this.sidebar.find('#view-choice').eq(0);

  this.mapControl = viewChoice.find('#view-choice__map').eq(0);
  this.listControl = viewChoice.find('#view-choice__list').eq(0);

  // Map store info
  this.sidebarInfo = this.sidebar.find('#sidebar-info').eq(0);
  this.footerInfo = this.footer.find('#footer-info').eq(0);

  // Search and location functionality
  this.locationBox = this.sidebar.find('#location-box').eq(0);

  this.searchField = this.locationBox.find('#map-search');
  this.locateUserButton = this.locationBox.find('.icon__location');

  this.autoComplete = new google.maps.places.Autocomplete(
    this.searchField.get(0));

  this.directionsPanel = this.mapContainer.find('#footer-directions').eq(0);

  // Directions
  this.directionsService = new google.maps.DirectionsService();
  this.directionsDisplay = new google.maps.DirectionsRenderer(this.getDirectionsRendererOptions());

  // Map options
  this.mapOptions = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: {lat: 56.9574059, lng: 24.065855},
    zoom: 12,
    gestureHandling: 'greedy',
    clickableIcons: true, // ban clicks on other markers
    mapTypeControl: false,
    fullscreenControl: false
  }

  this.map = new google.maps.Map($('#map--retail-stores').get(0), this.mapOptions);
  this.infoBox = new InfoBox();

  this.directionsDisplay.setMap(this.map);

  this.stores = createAllStores();
  this.holidays = [];
  this.markers = this.createMarkers();
  this.markerClusterer = this.createMarkerClusterer();

  var me = this;
  google.maps.event.addListener(this.markerClusterer, 'click', this.fitBoundsWithSidebar);
  google.maps.event.addListener(this.infoBox, 'domready', function () {
    this.offsetBox()
  });
  google.maps.event.addListener(this.map, 'center_changed', function () {
    me.infoBox.close();
  });
  this.setupPlaceChangedListener();

  this.populateListView();
}

RetailMap.prototype.createMarkers = function () {
  var me = this;
  var markers = [];

  var markerOptions = {
    icon: this.getBiteIcon(),
    shape: this.getBiteIconShape(),
    map: this.map
  };

  for (i = 0; i < this.stores.length; i++) {
    var store = this.stores[i];
    markerOptions.position = store.position;
    var marker = new google.maps.Marker(markerOptions);
    marker.storeID = i;

    markers.push(marker);

    google.maps.event.addListener(marker, 'mouseover', (function (marker, i) {
      return function () {
        me.infoBox.setOptions(me.getInfoBoxOptions());
        me.infoBox.setContent(me.getStoreMarkerInfo(i));
        me.infoBox.open(me.map, marker);
      }
    })(marker, i));

    google.maps.event.addListener(marker, 'mouseout', function (event) {
      me.infoBox.close();
    });

    google.maps.event.addListener(marker, 'click', (function (i) {
      return function () {
        me.activeMarker = markers[i];
        me.setDetailedInfo(i, me.footerInfo.children().eq(0));
        me.setDetailedInfo(i, me.sidebarInfo.children().eq(0));

        if (me.locationBox.hasClass('expanded')) {
          me.closeDirectionsPanel();
          me.openDirectionsPanel();
          me.calculateRoute();
        } else {
          me.openDetailedInfo();
        }
      }
    })(i));
  }

  return markers;
}

RetailMap.prototype.fitBoundsWithSidebar = function (cluster) {
  var bounds = cluster.getBounds();
  if ($(window).width() < 768) {
    var padding = {bottom: 50, top: 50, left: 50, right: 50};
  } else {
    var padding = {right: 380, left: 200, top: 200, bottom: 200};
  }
  this.map.fitBounds(bounds, padding);
}

RetailMap.prototype.getBiteIcon = function (scale = 1) {
  return icon = {
    size: new google.maps.Size(38, 52),
    scaledSize: new google.maps.Size(38 * scale, 52 * scale),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point((38 * scale - 1) / 2, (52 * scale - 1) / 2),
    url: 'images/icons/map-pin.svg'
  };
}

RetailMap.prototype.getBiteIconShape = function () {
  return shape = {
    coords: [19, 51, 7, 39, 0, 23, 0, 16, 5, 7, 14, 1, 22, 1, 33, 7, 37, 16, 37, 23, 30, 39, 19, 51],
    type: 'poly'
  };
}

RetailMap.prototype.getDirectionsRendererOptions = function () {
  return options = {
    suppressInfoWindows: true,
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: '#00a04a',
      strokeOpacity: 0.5,
      strokeWeight: 5
    },
    panel: $('#footer-directions').get(0)
  };
}

RetailMap.prototype.setupPlaceChangedListener = function () {
  var me = this;
  this.autoComplete.bindTo('bounds', this.map);
  this.autoComplete.addListener('place_changed', function () {
    var place = me.autoComplete.getPlace();
    if (place.name.trim().toLowerCase() === "your location") {
      me.getUserLocation();
      return;
    } else if (!place.place_id) {
      return;
    } else {
      me.setOrigin(place, false);
    }

    if (me.locationBox.hasClass('expanded')) {
      me.calculateRoute();
    } else {
      me.centerOrigin();
    }
  });
}

RetailMap.prototype.getUserLocation = function (event) {
  var me = this;
  if (!navigator.geolocation) {
    this.locateUserButton.addClass('disabled');
    this.searchField.attr('value', '*').val('Geolocation failed.');
  }
  else {
    this.locateUserButton.removeClass('disabled').addClass('locating');
    this.searchField.attr('value', '*').val('Locating...');
    navigator.geolocation.getCurrentPosition(
      function (position) {
        handleGeolocationSuccess(position, me)
      },
      function () {
        handleGeolocationFailure(me)
      },
      {maximumAge: 0,
      timeout: 6000});
  }

  function handleGeolocationSuccess (position, me) {
    var pos = new google.maps.LatLng({
      lat: position.coords.latitude,
      lng: position.coords.longitude
    });
    me.searchField.attr('value', '*').val('Your location');
    me.setOrigin(pos, false);
    me.locateUserButton.removeClass('locating');

    if (me.locationBox.hasClass('expanded')) {
      me.calculateRoute();
    } else {
      me.centerOrigin();
    }
  }

  function handleGeolocationFailure (me) {
    me.searchField.attr('value', '*').val('Geolocation failed');
    me.locateUserButton.removeClass('locating');
  }
}

RetailMap.prototype.setOrigin = function (origin, centerOrigin = false) {
  this.origin = origin;
  if (centerOrigin) this.centerOrigin();
}

RetailMap.prototype.centerOrigin = function () {
  if (!this.origin) return;
  var position = this.origin.geometry ? this.origin.geometry.location : this.origin;
  this.map.setCenter(position);
  this.showNearbyStores(position);
}

RetailMap.prototype.closeDetailedInfo = function (event) {
  this.footerInfo.removeClass('expanded');
  this.sidebarInfo.removeClass('expanded');
}

RetailMap.prototype.openDetailedInfo = function () {
  var storeInfo = ($(window).width() >= 768)
    ? this.sidebarInfo
    : this.footerInfo;
  storeInfo.addClass('expanded');
}

RetailMap.prototype.switchDetailedInfoLocation = function () {
  if ($(window).width() >= 768 && this.footerInfo.hasClass('expanded')) {
    this.footerInfo.removeClass('expanded');
    this.sidebarInfo.addClass('expanded');
  } else if ($(window).width() < 768 && this.sidebarInfo.hasClass('expanded')) {
    this.sidebarInfo.removeClass('expanded');
    this.footerInfo.addClass('expanded');
  } else {
    return false;
  }
}

RetailMap.prototype.setDetailedInfo = function (storeIndex, container) {
  var store = this.stores[storeIndex];

  var iconBar = container.find('.store-info__icon-bar');
  var times = container.find('.store-info__times');

  // Hide open popovers
  iconBar.find('.click-info').popover('hide');
  // Hide open times list
  this.closeTimeList();

  // Set address
  container.find('.store-info__title').text(store.address);

  // Hide all icons from bar
  iconBar.find('[class*="icon__store-amenity--"]').hide();
  // Show icons that the store has
  store.amenities.map(function (amenity, index) {
    iconBar.find('.icon__store-amenity--' + amenity).show();
  });

  iconBar.find('.js-icon__store-amenity-img')
    .mouseenter(handleImageMouseEnter)
    .mouseleave(handleImageMouseLeave)

  switchPopovers(iconBar);

  // Set description
  var hasBusinessCorner = store.businessSpecial;
  var descriptionContainer = container.find('.store-info__description');
  descriptionContainer.html(
    store.description ? store.description
    : hasBusinessCorner ? 'In this salon, Bite provides special business customer service.'
    : null
  );

  // Set phone nr
  container.find('.store-info__phone__text').text(store.phone ? store.phone : null);

  var openTodayInfo = this.getOpenNowInfo(store);
  this.setStoreInfoTimes(times, openTodayInfo.dataName, openTodayInfo.timesToday, openTodayInfo.timeList);

  if (openTodayInfo.holidaysDescription) {
    descriptionContainer.html(openTodayInfo.holidaysDescription).addClass('title--pink');
  }
}

RetailMap.prototype.getInfoBoxOptions = function (position = 'top-right') {
  var options = {
    boxClass: 'map__info-window map__info-window--top-right',
    closeBoxURL: '',
    alignBottom: true,
    pixelOffset: new google.maps.Size(17, -23),
    pane: 'floatPane',
    disableAutoPan: true, // Handled by offsetting window
    infoBoxClearance: new google.maps.Size(10, 10) // Padding from map edge
  };

  if (position === 'bottom-left') {
    options.alignBottom = false,
    options.pixelOffset = new google.maps.Size(-277, 11),
    options.boxClass = 'map__info-window map__info-window--bottom-left'
  }

  return options;
}

RetailMap.prototype.getStoreMarkerInfo = function (storeIndex) {
  var store = this.stores[storeIndex];

  var hasBusinessCorner = store.businessSpecial;
  var openTodayInfo = this.getOpenNowInfo(store);
  var openTodayMessage = this.parseStoreInfoTimes(openTodayInfo.dataName, openTodayInfo.timesToday);

  var infoContent =
  '<div class="iw__header">' + store.address + '</div>' +
  '<div class="iw__content">' + openTodayMessage + '</div>' +
  (hasBusinessCorner ? '<div class= "iw__business-corner">Business</div>' : '');

  return infoContent;
}

RetailMap.prototype.openTimeList = function (event) {
  var timeList = this.mapContainer.find('.store-info__times').find('ul');
  if (event && this.listControl.hasClass('active')) {
    timeList = timeList.add($(event.target).parent().parent());
  }
  var detailedHeading = timeList.children('.times__heading--detailed');
  var weekTimes = timeList.children('.times__heading--short, .times__day');

  detailedHeading.hide().addClass('hidden');
  weekTimes.show().removeClass('hidden');
  timeList.addClass('expanded');
}

RetailMap.prototype.closeTimeList = function () {
  var timeList = $('.store-info__times').find('ul');
  if (!timeList.hasClass('expanded')) {return false}

  var detailedHeading = timeList.children('.times__heading--detailed');
  var weekTimes = timeList.children('.times__heading--short, .times__day');

  weekTimes.hide().addClass('hidden');
  detailedHeading.show().removeClass('hidden');
  timeList.removeClass('expanded');
}

RetailMap.prototype.getOpenNowInfo = function (store) {
  var openTimes = store.openTimes;

  // modify openTimes depending on holidays
  var dateWorker = new Date();
  var hasHolidays = false, holidaysDescription = false;
  var currentDate = (new Date()).toISODate();
  for (var i = 0; i < 7; i++) {
    var weekday = dateWorker.getDay().toString();
    var date = dateWorker.toISODate();

    if (typeof this.holidays[date] != 'undefined' && typeof this.holidays[date].stores[store.id] != 'undefined') {
      openTimes[weekday] = this.holidays[date].stores[store.id];
      hasHolidays = true;
      if (currentDate == date && this.holidays[date].description) {
        holidaysDescription = this.holidays[date].description;
      }
    }

    dateWorker.setDate(dateWorker.getDate() + 1);
  }

  if (hasHolidays && !holidaysDescription) {
    holidaysDescription = 'There are changes in working hours at this week';
  }

  var now = new Date();
  var weekday = now.getDay().toString();

  var storeOpenToday = openTimes[weekday];
  var dataName, timesToday;

  if (storeOpenToday) {
    var opensAt = parseTimeString(storeOpenToday[0]);
    var closesAt = parseTimeString(storeOpenToday[1]);

    var opening = new Date();
    opening.setHours(opensAt[0]);
    opening.setMinutes(opensAt[1]);

    var closing = new Date();
    closing.setHours(closesAt[0]);
    closing.setMinutes(closesAt[1]);

    timesToday = storeOpenToday[0] + ' - ' + storeOpenToday[1];

    if (now < opening) {
      dataName = 'before-opening';
    } else if (now > opening && now < closing) {
      dataName = 'open';
    } else {
      dataName = 'after-closing';
    }

  } else {
    timesToday = '';
    dataName = 'closed';
  }

  var weekdays = ['1', '2', '3', '4', '5', '6', '0'];
  var firstHalf = weekdays.slice(weekdays.indexOf(weekday), weekdays.length);
  var sortedWeek = firstHalf.concat(weekdays.slice(0, weekdays.indexOf(weekday)));
  var timeList = sortedWeek.map(function (day) {
    return [remapWeekdayName(day), openTimes[day] ? openTimes[day][0] + ' - ' + openTimes[day][1] : 'Closed'];
  });

  return {
    dataName: dataName,
    timesToday: timesToday,
    timeList: timeList,
    holidaysDescription: holidaysDescription
  }
}

RetailMap.prototype.setStoreInfoTimes = function (container, dataName, timesToday, timeList) {
  var shortHeading = container.find('.times__heading--short').children().eq(1);
  var detailedHeading = container.find('.times__heading--detailed').children().eq(1);

  shortHeading.text(shortHeading.data(dataName));
  detailedHeading.text(detailedHeading.data(dataName) + timesToday);

  var weekList = container.children().eq(0).children('.times__day');

  weekList.map(function () {
    var content = timeList.shift();
    $(this).children().eq(0).text(content[0]);
    $(this).children().eq(1).text(content[1])
  });
}

RetailMap.prototype.parseStoreInfoTimes = function (dataName, timesToday, detailed = true, containerSelector = '.store-info__times') {
  if (detailed) {
    var detailedHeading = $(containerSelector).find('.times__heading--detailed').children().eq(1);
    return detailedHeading.data(dataName) + timesToday;
  } else {
    var shortHeading = $(containerSelector).find('.times__heading--short').children().eq(1);
    return shortHeading.data(dataName);
  }
}

RetailMap.prototype.createMarkerClusterer = function () {
  var clusterStyle = {
    anchorText: [6, 0],
    fontFamily: 'inherit',
    fontWeight: '400',
    textSize: 16,
    textColor: '#fff',
    width: 45,
    height: 62,
    url: 'images/icons/map-pin-cluster.svg'
  };

  var clustererOptions = {
    averageCenter: true,
    clusterClass: 'map__pin--clustered',
    styles: [clusterStyle, clusterStyle, clusterStyle, clusterStyle, clusterStyle],
    zoomOnClick: false // zooming is handled with custom function to accomodate sidebar/footer
  };

  var markerClusterer = new MarkerClusterer(this.map, this.markers, clustererOptions);

  return markerClusterer;
}

RetailMap.prototype.switchToMapView = function () {
  if (this.activeMarker) {
    this.map.setCenter(this.activeMarker.getPosition());
    this.map.setZoom(13);
    google.maps.event.trigger(this.activeMarker, 'click');
  }
  this.mapContainer.removeClass('inactive');
  this.listContainer.addClass('inactive');
  this.listControl.removeClass('active');
  this.mapControl.addClass('active');
}

RetailMap.prototype.switchToListView = function () {
  if (this.locationBox.hasClass('expanded')) this.closeDirectionsPanel();

  var location = this.activeMarker
    ? this.activeMarker
    : this.map.getCenter()

  this.showNearbyStores(location);

  this.listContainer.removeClass('inactive');
  this.mapContainer.addClass('inactive');
  this.mapControl.removeClass('active');
  this.listControl.addClass('active');

  if (this.activeMarker) this.focusActiveMarker();
}

RetailMap.prototype.populateListView = function () {
  var template = this.listContainer.find('#store-info__container-proto').eq(0);

  for (var i = 0; i < this.stores.length; i++) {
    var storeContainer = template.clone(true).attr('id', i).appendTo(this.listContainer);
    this.setDetailedInfo(i, storeContainer);
  }
}

RetailMap.prototype.showNearbyStores = function (location) {
  var position = location.icon ? location.getPosition() : location;

  var numberOfStores = 10;
  var storeEntries = this.listContainer.children().not('#store-info__container-proto').hide().addClass('hidden');

  var distancesToStores = this.stores.map(function (store, i) {
    var distance = google.maps.geometry.spherical.computeDistanceBetween(position, new google.maps.LatLng(store.position));
    return {index: i, distance: distance}
  });

  distancesToStores.sort(function (a, b) {
    if (a.distance > b.distance) return 1;
    if (a.distance < b.distance) return -1;
    return 0;
  });

  var sortedStoreIndices = distancesToStores.map(function (el) {return el.index});

  var storesToShow = sortedStoreIndices.length < numberOfStores ? sortedStoreIndices : sortedStoreIndices.slice(0, numberOfStores);

  var order = 1;
  storesToShow.map(function (storeIndex) {
    storeEntries.eq(storeIndex).show().attr('tabindex', order).removeClass('hidden').css('order', order++);
  });
}

RetailMap.prototype.focusActiveMarker = function () {
  var selector = '#' + this.activeMarker.storeID;
  this.listContainer.children(selector).focus();
}

RetailMap.prototype.calculateRoute = function () {
  if (!this.origin) return;

  var me = this;
  var target = this.activeMarker.getPosition();
  var request = {
    origin: this.origin.geometry ? this.origin.geometry.location : this.origin,
    destination: target,
    travelMode: 'DRIVING',
    provideRouteAlternatives: true
  };
  this.directionsService.route(request, function (result, status) {
    if (status === 'OK') {
      me.handleRouteSuccess(result);
    } else {
      console.log('Status: ' + status);
    }
  });
}

RetailMap.prototype.handleRouteSuccess = function (result) {
  this.directionsDisplay.setDirections(result);
  this.directionsPanel = $('#footer-directions'); // Refresh object after directions added to panel
  var me = this;
  setTimeout(function () {
    me.prepareSingleRouteHTML(result);
    me.directionsPanel.addClass('expanded');
  }, 200);
}

RetailMap.prototype.prepareSingleRouteHTML = function (result) {
  var summaryDiv = $('#footer-directions').find('.adp-summary').eq(0);
  if (summaryDiv.parent().parent().hasClass('adp-summary__container')) return;
  summaryDiv.prepend('<b>' + result.routes[0].summary + '</b>').wrap('<div class="adp-summary__container"><div class="adp-summary__cell"></div></div>');
}

RetailMap.prototype.switchDirectionsLocation = function () {
  if ($(window).width() >= 768 && this.directionsPanel.parent().hasClass('map__footer')) {
    this.directionsPanel.appendTo(this.sidebar);
  } else if ($(window).width() < 768 && this.directionsPanel.parent().hasClass('map__sidebar')) {
    this.directionsPanel.appendTo(this.footer);
  } else {
    return false;
  }
}

RetailMap.prototype.toggleDirectionsPanel = function () {
  if (this.locationBox.hasClass('expanded')) {
    this.closeDirectionsPanel();
  } else {
    this.openDirectionsPanel();
  }
}

RetailMap.prototype.openDirectionsPanel = function () {
  var activeStore = this.stores[this.activeMarker.storeID];

  var destinationGroup = this.locationBox.children('.input-group').eq(1);
  destinationGroup.children('input').attr('value', '*').val(activeStore.address); // .attr is workaround to move label properly
  destinationGroup.removeClass('hidden');

  this.closeDetailedInfo();
  this.calculateRoute();

  this.locationBox.addClass('expanded');
}

RetailMap.prototype.closeDirectionsPanel = function () {
  this.locationBox.children('.input-group').eq(1).addClass('hidden');

  this.locationBox.removeClass('expanded');

  this.directionsDisplay.set('directions', null);
  this.directionsPanel.removeClass('expanded');

  this.openDetailedInfo();
}

var retailMap;

// Google Maps scripts loaded callback
var mapLibsLoaded = 0;
function handleMapLibLoaded () {
  mapLibsLoaded++;
  if (mapLibsLoaded < 3) return;

  registerLibDependantFunctions();
  retailMap = new RetailMap();
}

function registerLibDependantFunctions () {
  InfoBox.prototype.offsetBox = function () {
    var map = this.getMap();

    if (map instanceof google.maps.Map) {
      var mapDiv = map.getDiv();
      var mapWidth = mapDiv.offsetWidth; // px
      var iwOffsetX = this.pixelOffset_.width; // offset x
      var iwOffsetY = this.pixelOffset_.width; // offset y
      var iwWidth = this.div_.offsetWidth;
      var iwHeight = this.div_.offsetHeight;
      var padX = this.infoBoxClearance_.width;
      var padY = this.infoBoxClearance_.height;

      var pixPosition = this.getProjection().fromLatLngToContainerPixel(this.position_); // Origin

      var iwX = padX + iwOffsetX + iwWidth;
      var iwY = padY + iwOffsetY + iwHeight;

      var spaceRight = mapWidth - pixPosition.x;
      var spaceTop = pixPosition.y;

      if (spaceRight < iwX || spaceTop < iwY) {
        this.setOptions(retailMap.getInfoBoxOptions('bottom-left'));
      }
    }
  };
}

function getRandomInt (max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function getRandomIntBetween (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
}

// Parses format hh:mm (string) to [hh, mm] (array of int)
function parseTimeString (timeString) {
  return timeString.split(':').map(function (el) {return parseInt(el, 10);});
}

function remapWeekdayName (weekday) {
  var nameMap = {'0' : 'Sunday', '1' : 'Monday', '2' : 'Tuesday', '3' : 'Wednesday', '4' : 'Thursday', '5' : 'Friday', '6' : 'Saturday'};

  if (Array.isArray(weekday)) {
    return weekday.map(function (weekdayIndex) {return nameMap[weekdayIndex]});
  }
  else return nameMap[weekday];
}

function createStore (location, jitter) {
  var openTimesList = [['9:00','17:00'], ['10:00','22:00'], ['10:00','21:00'], ['10:00','21:00'], ['9:00', '21:00'], null];
  var amenitiesList = ['expert', 'repair', 'utilization', 'business', 'contacts', 'accessories'];

  var latChange = (Math.random() < 0.5) ? (-1 * Math.random() * jitter.lat) : Math.random() * jitter.lat;
  var lngChange = (Math.random() < 0.5) ? (-1 * Math.random() * jitter.lng) : Math.random() * jitter.lng;

  var position = {
    lat: location.lat + latChange,
    lng: location.lng + lngChange
  }

  var amenities = amenitiesList.slice(0, getRandomIntBetween(2, amenitiesList.length));

  return {
    address: 'Longer name street ' + getRandomInt(300) + ' (' + ((Math.random() < 0.3) ? 'Maxima' : (Math.random() < 0.6) ? 'Rimi' : 't/c Alfa') + ')',
    position: position,
    amenities: amenities,
    businessSpecial: amenities.includes('business'),
    openTimes: {
      '1': openTimesList[getRandomInt(openTimesList.length)],
      '2': openTimesList[getRandomInt(openTimesList.length)],
      '3': openTimesList[getRandomInt(openTimesList.length)],
      '4': openTimesList[getRandomInt(openTimesList.length)],
      '5': openTimesList[getRandomInt(openTimesList.length)],
      '6': openTimesList[getRandomInt(openTimesList.length)],
      '0': openTimesList[getRandomInt(openTimesList.length)],
    },
    description: Math.random() < 0.5 ? 'This store has a description.' : null,
    phone: '555 444 333'
  };
}

function createStores (location, jitter, amount) {
  var stores = [];
  for (i = 0; i < amount; i++) {
    stores.push(createStore(location, jitter));
  }
  return stores;
}

function createAllStores () {
  var stores = [];
  var commands = [
    {location: {lat: 56.950104, lng: 24.096629}, jitter: {lat: 0.062, lng: 0.05}, amount: 15, cityName: 'Riga'}, // RIGA
    {location: {lat: 56.656900, lng: 23.718971}, jitter: {lat: 0.03, lng: 0.025}, amount: 5, cityName: 'Jelgava'}, // JELGAVA
    {location: {lat: 57.308763, lng: 25.275152}, jitter: {lat: 0.03, lng: 0.025}, amount: 3, cityName: 'Cesis'}, // CESIS
    {location: {lat: 57.420859, lng: 27.051702}, jitter: {lat: 0.03, lng: 0.025}, amount: 3, cityName: 'Aluksne'}, // ALUKSNE
    {location: {lat: 55.873499, lng: 26.505015}, jitter: {lat: 0.03, lng: 0.025}, amount: 5, cityName: 'Daugavpils'}, // DAUGAVPILS
    {location: {lat: 56.505396, lng: 27.337924}, jitter: {lat: 0.03, lng: 0.025}, amount: 2, cityName: 'Rezekne'}, // REZEKNE
    {location: {lat: 56.668048, lng: 22.485576}, jitter: {lat: 0.03, lng: 0.025}, amount: 3, cityName: 'Saldus'}, // SALDUS
  ];

  commands.map(function (command) {
    createStores(command.location, command.jitter, command.amount).map(function (store) {
      store.address += ', ' + command.cityName;
      stores.push(store);
    });
  });

  return stores;
}

function handleDirectionsClick (event) {
  retailMap.openDirectionsPanel();
  return false;
}

function handleImageMouseEnter (event) {
  if ($(window).width() < 768) return;

  var image = $(event.target);
  image.attr('src', image.data('hover-image-src'));
}

function handleImageMouseLeave (event) {
  if ($(window).width() < 768) return;

  var image = $(event.target);
  if (image.attr('src') !== image.data('image-src')) {
    image.attr('src', image.data('image-src'));
  } else return;
}

function initializeMobilePopovers () {
  $('.click-info').popover(getPopoverOptions('manual', 'popover--amenity', 'bottom'));

  // Register mobile popover triggers
  $('.click-info')
    .click(function () {
      // Dont open popover with clicking on desktop, or when the click comes out of the focusout event
      if ($(window).width() < 768 && (!$('.popover').length || !$(this).hasClass('active'))) {
        $(this)
          .attr('src', $(this).data('hover-image-src'))
          .addClass('active')
          .popover('show');
        return false;
      } else return false;
    })
    // Change icon back to normal when popover is closed
    .on('hidden.bs.popover', function () {
      $(this)
        .attr('src', $(this).data('image-src'))
        .removeClass('active');
    })
    // Add click to close listener to created popovers
    .on('shown.bs.popover', function () {
      var button = $(this);
      $('.popover')
        .click(function (event, originator = button) {
          originator.popover('hide');
          return false;
        });
    })
    // Close popover on any other action
    .focusout(function () {
      $(this).popover('hide');
      return true;
    })
    // Give focus to button
    .attr('tabindex', 0);
}


function switchPopovers ($container) {
  var $hoverInfo = $container ? $container.find('.hover-info') : $('.hover-info');
  if ($(window).width() >= 768) {
    // Hide mobile popovers
    var $clickInfo = $container ? $container.find('.click-info') : $('.click-info');
    $clickInfo.popover('hide');

    $hoverInfo.each(function () {
      var content = $(this).data('content') || $(this).find('[data-content]').data('content');
      if (content) {
        $(this)
          .data('content', content)
          .addClass('hover-info--active')
          .popover(getPopoverOptions('hover', 'popover--amenity'));
      }
    });
  } else if ($hoverInfo.filter('.hover-info--active').length) {
    $hoverInfo.removeClass('hover-info--active').popover('destroy');
  }
}

function getPopoverOptions (trigger, classes = '', placement = null) {
  var options = {
    animation: false,
    container: 'body',
    template:'<div class="popover popover--green ' + classes + '" role="tooltip"><div class="popover-content"></div></div>',
    trigger: trigger,
    viewport: {'selector': 'body', 'padding': 20}
  };
  if (placement) options['placement'] = placement;
  return options;
}

function handleViewChoiceClick (event) {
  var choice = $(event.target);
  if (choice.hasClass('active')) {
    return false;
  }

  if (choice.is('#view-choice__map')) {
    retailMap.switchToMapView();
    return false;
  } else if (choice.is('#view-choice__list')) {
    retailMap.switchToListView();
    return false;
  }
}

function handleWholeWeekTimesClick (event) {
  if ($(this).hasClass('icon__link-arrow-green--down')) {
    retailMap.openTimeList(event);
  } else if ($(this).hasClass('icon__link-arrow-green--up')) {
    retailMap.closeTimeList(event);
  } else return false;
}

function handlePinClick (event) {
  var storeContainer = $(event.target).parent().parent().attr('id')
    ? $(event.target).parent().parent()
    : $(event.target).parent().parent().parent().parent();

  var storeID = parseInt(storeContainer.attr('id'), 10);
  retailMap.activeMarker = retailMap.markers[storeID];
  retailMap.switchToMapView();
}

function handleGeolocationClick (event) {
  retailMap.getUserLocation();
}

jQuery (function($) {
  // Close store info (mobile view)
  $('#footer-info').find('.icon__close-small').click(function (event) {
    retailMap.closeTimeList();
    retailMap.closeDetailedInfo();
    retailMap.activeMarker = null;
  });

  // Toggle store week times
  $('.store-info__times').find('.times__heading').children('.icon__link-arrow-green').click(handleWholeWeekTimesClick);

  $('.store-info__container--list')
    .focus(function (event) {
      var storeID = parseInt($(this).attr('id'), 10);
      retailMap.activeMarker = retailMap.markers[storeID];
    })
    .focusout(function (event) {
      retailMap.closeTimeList();
    });

  initializeMobilePopovers();

  // Window initial size and resize event functions
  if ($(window).width() >= 768) {
    // Move store info to sidebar.
    retailMap.switchDetailedInfoLocation();
    retailMap.switchDirectionsLocation();

    // Switch to desktop popovers
    switchPopovers();
  }

  $(window).resize(function () {
    // Move store info to sidebar or footer based on window width.
    retailMap.switchDetailedInfoLocation();
    retailMap.switchDirectionsLocation();

    // Switch popovers to mobile or desktop functionality
    switchPopovers();
  });

  // Locate user when crosshair in location field clicked
  $('.icon__location--field').click(handleGeolocationClick);

  // Switch to map and center on marker
  $('.icon__map-pin').click(handlePinClick);

  // View selection controls
  $('#view-choice').children('ul').children().click(handleViewChoiceClick);

  // Show directions to store when clicking on icon
  $('.icon__directions').click(handleDirectionsClick);
});
