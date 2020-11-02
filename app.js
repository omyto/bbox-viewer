function lon2tile(lon,zoom) { return (Math.floor((lon+180)/360*Math.pow(2,zoom))); }
function lat2tile(lat,zoom)  { return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); }
function tile2lon(x,z) {
  return (x/Math.pow(2,z)*360-180);
 }
 function tile2lat(y,z) {
  var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
  return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
 }
 function tile2bbox(tile) {
   return {
    north: tile2lat(tile.y, tile.zoom),
    south: tile2lat(tile.y + 1, tile.zoom),
    west: tile2lon(tile.x, tile.zoom),
    east: tile2lon(tile.x + 1, tile.zoom),
   }
 }

 var global = {
  location: {},
  location1: null,
  location2: null,
  path: [],
  zoom: 0,
  polyline: null,
  map: null,
 }

 function setup() {
  let tile1 = {
    x: 104066,
    y: 57709,
    zoom: 17
  }

  let tile2 = {
    x: 104067,
    y: 57710,
    zoom: 17
  }

  global.zoom = +$("#zoom").val()

  let lat1 = $("#location1 .latitude").val() || null
  let lng1 = $("#location1 .longitude").val() || null

  let lat2 = $("#location2 .latitude").val() || null
  let lng2 = $("#location2 .longitude").val() || null

  if (lat1 == null || lat2 == null || lng1 == null || lng2 == null) {
    alert("Wrong location!")
    return false
  }

  global.location1 = {
    lat: Math.max(+lat1, +lat2),
    lng: Math.min(+lng1, +lng2)
  }

  global.location2 = {
    lat: Math.min(+lat1, +lat2),
    lng: Math.max(+lng1, +lng2)
  }

  if (global.zoom > 19 || global.zoom < 5) {
    alert("zom >= 17 & zoom <= 19")
    return false
  }

  if (global.location1 != null) {
    global.tile1 = {}
    global.tile1.x = lon2tile(global.location1.lng, global.zoom)
    global.tile1.y = lat2tile(global.location1.lat, global.zoom)
    global.tile1.zoom = global.zoom
  }
  if (global.location2 != null) {
    global.tile2 = {}
    global.tile2.x = lon2tile(global.location2.lng, global.zoom)
    global.tile2.y = lat2tile(global.location2.lat, global.zoom)
    global.tile2.zoom = global.zoom
  }

  let tileTopLeftBox = tile2bbox(global.tile1)
  let tileBottomRightBox = tile2bbox(global.tile2)

  global.path = [
    [tileTopLeftBox.west, tileTopLeftBox.north],
    [tileBottomRightBox.east, tileTopLeftBox.north],
    [tileBottomRightBox.east, tileBottomRightBox.south],
    [tileTopLeftBox.west, tileBottomRightBox.south],
    [tileTopLeftBox.west, tileTopLeftBox.north]
  ]
  $("#bbox").text(tileTopLeftBox.west + ' ' + ' ' + tileBottomRightBox.south +' '+ tileBottomRightBox.east + ' ' + tileTopLeftBox.north );
  return true
 }

 function initMap() {
  let map = new map4d.Map(document.getElementById("map"),
  {
    center: [105.828042, 21.007651],
    zoom: 17,
    geolocate: true,
    controls : false,
    tilt: 0,        
    accessKey: `208e1c99aa440d8bc2847aafa3bc0669`
  }
  )
  global.map = map
  //set switch mode Auto for automatically switching between 2D & 3D
  console.log("initMap")
  map.setSwitchMode(map4d.SwitchMode.Auto)
  map.enable3dMode(true)

  map.addListener("rightClick", (args) => {
    console.log(args)
    global.location = {...args.location}
    $('.ui.dropdown').css({top: args.point.y - 15, left: args.point.x});
    $('.ui.dropdown').click()
  })

  map.addListener("click", (args) => {
    console.log(args)
    let dropdown = $('.ui.dropdown')
    if (dropdown.attr('class').includes('visible')) {
      dropdown.click()
    }
  })
 }

 function tapBuilding() {
   let enable = global.map.isObjectsEnabled()
   global.map.setObjectsEnabled(!enable)
   global.map.setPlacesEnabled(!enable)
 }

 function tapCenter() {
   if (!setup()) {
    return
   }
   if (global.polyline != null) {
     global.polyline.setMap(null)
   }

  let polyline = new map4d.Polyline({
    path: global.path,
    strokeColor: "#ff0000",
    strokeOpacity: 1.0,
    strokeWidth: 1
  })
  global.polyline = polyline
  polyline.setMap(global.map)
  let camera = global.map.getCamera()
  camera.setTarget(global.location1)
  camera.setBearing(0)
  camera.setTilt(0)
  camera.setZoom(global.zoom)
  global.map.moveCamera(camera)
 }

 function tapReset() {
  let camera = global.map.getCamera()
  camera.setBearing(0)
  camera.setTilt(0)
  global.map.moveCamera(camera)
 }

 function contextOption(option){
  switch (option) {
    case 0:
      $('#ui').transition('scale')
      break
    case 1:
      $("#location1 .latitude").val(global.location.lat)
      $("#location1 .longitude").val(global.location.lng)
      break
    case 2:
      $("#location2 .latitude").val(global.location.lat)
      $("#location2 .longitude").val(global.location.lng)
      break;
  }
 }
