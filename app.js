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
    tilt: 0,        
    accessKey: `208e1c99aa440d8bc2847aafa3bc0669`,
    controls: true,
    geolocate: true,
    controlOptions: map4d.ControlOptions.BOTTOM_RIGHT
  }
  )
  global.map = map
  //set switch mode Auto for automatically switching between 2D & 3D
  console.log("initMap")
  // map.setSwitchMode(map4d.SwitchMode.Auto3DTo2D)
  map.enable3dMode(true)

  map.addListener("rightClick", (args) => {
    console.log(args)
    global.location = {...args.location}
    $('.ui.dropdown').css({top: args.pixel.y - 15, left: args.pixel.x});
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
   let enable = global.map.isBuildingsEnabled;
   global.map.setBuildingsEnabled(!enable)
   global.map.setPOIsEnabled(!enable)
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

 
var createImage = function (location0, location1, zoom) {
  let server = "http://rtile.map4d.vn/all/2d";
  if (!global.map) {
    return;
  } else {
    if (global.map.is3dMode()) {
      server = "http://rtile.map4d.vn/all/3d";
    }
  }

  let width = 1;
  let height = 1;    
  let sources = [];
  let x0 = lon2tile(location0.lng, zoom);
  let y0 = lat2tile(location0.lat, zoom);
  let x1 = lon2tile(location1.lng, zoom);
  let y1 = lat2tile(location1.lat, zoom);
  let minx = Math.min(x0, x1);
  let maxx = Math.max(x0, x1);
  let miny = Math.min(y0, y1);
  let maxy = Math.max(y0, y1);
  width = 256 * (maxx - minx + 1);
  height = 256 * (maxy - miny + 1);
  for (let x = minx; x <= maxx; x += 1) {
      for (let y = miny; y <= maxy; y += 1) {
          let offsetX = (x - minx) * 256;
          let offsetY = (y - miny) * 256;
          sources.push({
		  src: `${server}/${zoom}/${x}/${y}.png`, 
              x: offsetX,
              y: offsetY });
      }
  }    
  mergeImages(sources, {
      width: width,
      height: height
    })
      .then(b64 => downloadBase64(b64));
}

var downloadBase64 = function(data) {    
  var a = document.createElement("a"); //Create <a>
  a.href = data; //Image Base64 Goes here
  a.download = "SuaDepTrai.png"; //File name Here
  a.click();
}

var tapExport = function () {  
  createImage(global.location1, global.location2, global.zoom);
}


// Defaults
const defaultOptions = {
format: 'image/png',
quality: 1.0,
width: undefined,
height: undefined,
Canvas: undefined,
crossOrigin: "Anonymous"
};

// Return Promise
const mergeImages = (sources = [], options = {}) => new Promise(resolve => {
options = Object.assign({}, defaultOptions, options);

// Setup browser/Node.js specific variables
const canvas = options.Canvas ? new options.Canvas() : window.document.createElement('canvas');
const Image = options.Image || window.Image;

// Load sources
const images = sources.map(source => new Promise((resolve, reject) => {
  // Convert sources to objects
  if (source.constructor.name !== 'Object') {
    source = { src: source };
  }

  // Resolve source and img when loaded
  const img = new Image();
  img.crossOrigin = options.crossOrigin;
  img.onerror = () => reject(new Error('Couldn\'t load image'));
  img.onload = () => resolve(Object.assign({}, source, { img }));
  img.src = source.src;
}));

// Get canvas context
const ctx = canvas.getContext('2d');

// When sources have loaded
resolve(Promise.all(images)
  .then(images => {
    // Set canvas dimensions
    const getSize = dim => options[dim] || Math.max(...images.map(image => image.img[dim]));
    canvas.width = getSize('width');
    canvas.height = getSize('height');

    // Draw images to canvas
    images.forEach(image => {
      ctx.globalAlpha = image.opacity ? image.opacity : 1;
      return ctx.drawImage(image.img, image.x || 0, image.y || 0);
    });

    if (options.Canvas && options.format === 'image/jpeg') {
      // Resolve data URI for node-canvas jpeg async
      return new Promise((resolve, reject) => {
        canvas.toDataURL(options.format, {
          quality: options.quality,
          progressive: false
        }, (err, jpeg) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(jpeg);
        });
      });
    }

    // Resolve all other data URIs sync
    return canvas.toDataURL(options.format, options.quality);
  }));
});