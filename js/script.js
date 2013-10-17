//

(function(){

	var shpURL = "../../shapefiles/nyct2010.shp";
	var dbfURL = "../../shapefiles/nyct2010.dbf";

	var shpFile;
	var dbfFile;

	window.onload = function() {
		var shpLoader = new BinaryAjax(shpURL, onShpComplete, onShpFail);
		var dbfLoader = new BinaryAjax(dbfURL, onDbfComplete, onDbfFail);
	};

	function onShpFail() {
		alert('failed to load ' + shpURL);
	}

	function onDbfFail() {
		alert('failed to load ' + dbfURL);
	}

	function onShpComplete(oHTTP) {
		var binFile = oHTTP.binaryResponse;

		if (window.console && window.console.log) console.log('got data, parsing shapefile');

		shpFile = new ShpFile(binFile);

		if (shpFile.header.shapeType != ShpType.SHAPE_POLYGON && shpFile.header.shapeType != ShpType.SHAPE_POLYLINE) {
			alert("Shapefile does not contain Polygon records (found type: "+shpFile.header.shapeType+")");
		}

		//if (window.console && window.console.log) console.log(records);
		if (dbfFile) {
			render(shpFile.records, dbfFile.records);
		}
	}

	function onDbfComplete(oHTTP) {
		var binFile = oHTTP.binaryResponse;

		if (window.console && window.console.log) console.log('got data, parsing dbf file');

		dbfFile = new DbfFile(binFile);

		//if (window.console && window.console.log) console.log(dbfFile.records);

		if (shpFile) {
			render(shpFile.records, dbfFile.records);
		}
	}


	function render(records, data) {

		if (window.console && window.console.log) console.log('creating canvas and rendering');

		var canvas = document.getElementById('map');

		if (window.G_vmlCanvasManager) {
			G_vmlCanvasManager.initElement(canvas);
		}

		var t1 = new Date().getTime();
		if (window.console && window.console.log) console.log('calculating bbox...');

		var box;
		for (var i = 0; i < records.length; i++) {
			var record = records[i];
			if (record.shapeType == ShpType.SHAPE_POLYGON || record.shapeType == ShpType.SHAPE_POLYLINE) {
				var shp = record.shape;
				for (var j = 0; j < shp.rings.length; j++) {
					var ring = shp.rings[j];
					for (var k = 0; k < ring.length; k++) {
						if (!box) {
							box = { x: ring[k].x, y: ring[k].y, width: 0, height: 0 };
						}
						else {
							var l = Math.min(box.x, ring[k].x);
							var t = Math.min(box.y, ring[k].y);
							var r = Math.max(box.x+box.width, ring[k].x);
							var b = Math.max(box.y+box.height, ring[k].y);
							box.x = l;
							box.y = t;
							box.width = r-l;
							box.height = b-t;
						}
					}
				}
			}
		}

		var t2 = new Date().getTime();
		if (window.console && window.console.log) console.log('found bbox in ' + (t2 - t1) + ' ms');

		t1 = new Date().getTime();
		if (window.console && window.console.log) console.log('starting rendering...');

		var ctx = canvas.getContext('2d');
		
		var sc = Math.min(800 / box.width, 400 / box.height);

		ctx.fillStyle = '#ccccff';
		ctx.fillRect(0,0,800,400);

		ctx.lineWidth = 0.5;
		ctx.strokeStyle = '#ffffff';
		for (var i = 0; i < records.length; i++) {
			var record = records[i];
			if (record.shapeType == ShpType.SHAPE_POLYGON || record.shapeType == ShpType.SHAPE_POLYLINE) {
				var shp = record.shape;
				for (var j = 0; j < shp.rings.length; j++) {
					var ring = shp.rings[j];
					if (ring.length < 1) continue;
					ctx.fillStyle = getFillRecord(data[i]);
					ctx.beginPath();
					ctx.moveTo((ring[0].x - box.x) * sc, 400 - (ring[0].y - box.y) * sc);
					for (var k = 1; k < ring.length; k++) {
						ctx.lineTo((ring[k].x - box.x) * sc, 400 - (ring[k].y - box.y) * sc);
					}
					ctx.fill();
					ctx.stroke();
				}
			}
		}
		t2 = new Date().getTime();
		if (window.console && window.console.log) console.log('done rendering in ' + (t2 - t1) + ' ms');
	}

	function getFillRecord(record) {
		var colors = ["#F1EEF6", "#D4B9DA", "#C994C7", "#DF65B0", "#DD1C77", "#980043"];
		var popn = parseInt(record.values['POP2005'], 10);
		if (!isNaN(popn)) {
			popn = Math.max(0, Math.min(100000000, popn));
			var colorIndex = parseInt((colors.length-1) * popn / 100000000, 10);
			var color = colors[colorIndex];
			//if (window.console && window.console.log) console.log('popn: ' + popn + ' color: ' + color);  
			return color;
		}
		return '#000000';
	}

})();