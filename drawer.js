//kineticjs variables
var ic_stage;
var ic_markerLayer;	//maker rect area

var ic_last_group;
var ic_current_group;
var ic_mouse_down = false;
var ic_marker_distance = 10;

function init(stage) {
	ic_stage = stage;
	ic_markerLayer = new Kinetic.Layer();
	//this rect will allow us to use mouse events on the layer
	ic_markerLayer.add(new Kinetic.Rect({x: 0, y: 0, width: ic_stage.width(), height: ic_stage.height(), fill:'transparent', name:"bg"}));
	ic_stage.add(ic_markerLayer);
	ic_markerLayer.on('mousedown', onMouseDown);
	ic_markerLayer.on('mousemove', onMouseMove);
	ic_markerLayer.on('mouseup', onMouseUp);
}

function addAnchor(group, x, y, name) {
	//group must be added to layer before this function called
	var layer = group.getLayer();
	var anchor = new Kinetic.Circle({
		x: x,
		y: y,
		stroke: "red",
		strokeWidth: 2,
		fill: "transparent",
		radius: 8,
		draggable: true,
		name: name,
	});
	//hide anchor until mouseup
	anchor.hide();
	anchor.on('dragmove', function(){
		console.log('dragmove anchor');
		resizeGroup(this);
		layer.batchDraw();
	});
	anchor.on('dragend', function(){
		console.log('dragend anchor');
	});
	anchor.on('mousedown', function(e){
		console.log('mousedown anchor');
		//not bubble event to layer
		e.cancelBubble = true;
	});
	anchor.on('mouseup', function(e){
		console.log('mouseup anchor');
		//not bubble event to layer
		e.cancelBubble = true;
	});
	//hover styling
	anchor.on('mouseover', function(){
		console.log("mouseover anchor");
		document.body.style.cursor = 'pointer';
		this.setStrokeWidth(4);
		layer.draw();
	});
	anchor.on('mouseout', function(){
		console.log("mouseout anchor");
		document.body.style.cursor = 'default';
		this.setStrokeWidth(2);
		layer.draw();
	});
	group.add(anchor);
}

function createGroup(x, y) {
	group = new Kinetic.Group({
		x: x,
		y: y,
		draggable: false,
	});
	var rect = new Kinetic.Rect({
		x: 0,
		y: 0,
		width: 1,
		height: 1,
		fill: 'transparent',
		stroke: 'green',
		strokeWidth: 2,
		name: 'rect',
		dash: [5, 5],
		dashEnabled: false,
	});
	//add group to layer before calling addAnchor()
	ic_markerLayer.add(group);
	group.add(rect);
	addAnchor(group, 0, 0, 'topleft');
	addAnchor(group, rect.width(), 0, 'topright');
	addAnchor(group, rect.width(), rect.height(), 'bottomright');
	addAnchor(group, 0, rect.height(), 'bottomleft');

	return group;
}

function onMouseDown() {
	console.log("mousedown");
	ic_mouse_down = true;
	var start_pos = stage.getPointerPosition();
	//console.log(start_pos);
	ic_current_group = createGroup(start_pos.x, start_pos.y);
	if (ic_last_group) {
		//last group becomes not resizable
		updateGroupStatus(ic_last_group, "mousedown");
		ic_last_group.on("dblclick", function(){
			this.remove();
			ic_markerLayer.draw();
		});
	}
}

 function onMouseUp() {
 	console.log("mouseup");
	ic_mouse_down = false;
	var rect = ic_current_group.get('.rect')[0];
	if (Math.abs(rect.width()) < ic_marker_distance || Math.abs(rect.height()) < ic_marker_distance) {
		//distance too small, not valid
		ic_current_group.remove();
	} else {
		//current group becomes resizable
		updateGroupStatus(ic_current_group, "mouseup");
		ic_last_group = ic_current_group;
	}
	ic_current_group = null;
	ic_markerLayer.draw();
}

 function onMouseMove(){
	var mousePos = stage.getPointerPosition();
	if (ic_mouse_down) {
		var rect = ic_current_group.get('.rect')[0];
		var topleft = ic_current_group.get('.topleft')[0];
		var topright = ic_current_group.get('.topright')[0];
		var bottomright = ic_current_group.get('.bottomright')[0];
		var bottomleft = ic_current_group.get('.bottomleft')[0];

		var attrs = ic_current_group.attrs;
		rect.setWidth(mousePos.x - attrs.x);
		rect.setHeight(mousePos.y - attrs.y);

		topright.x(mousePos.x - attrs.x);
		bottomright.x(mousePos.x - attrs.x);
		bottomright.y(mousePos.y - attrs.y);
		bottomleft.y(mousePos.y - attrs.y);
		//call drawScene() instead of draw() when mousemove
		ic_markerLayer.drawScene();
	}
}

function updateGroupStatus(group, status) {
	var rect = group.get('.rect')[0];
	var circles = group.getChildren(function(node){
		return node.getClassName() === "Circle";
	});
	switch (status) {
		case "mouseup":
			rect.dashEnabled(true);
			for (var i = 0; i < circles.length; i++) {
				circles[i].show();
			}
			rect.on('mouseover', function(){
				console.log("mouseover rect");
				document.body.style.cursor = 'move';
				group.draggable(true);
				ic_markerLayer.off("mousedown mousemove mouseup");
			});
			rect.on('mouseout', function(){
				console.log("mouseout rect");
				document.body.style.cursor = 'default';
				group.draggable(false);
				ic_markerLayer.on('mousedown', onMouseDown);
				ic_markerLayer.on('mousemove', onMouseMove);
				ic_markerLayer.on('mouseup', onMouseUp);
			});
			break;
		case "mousedown":
			rect.dashEnabled(false);
			for (var i = 0; i < circles.length; i++) {
				circles[i].hide();
			}
			rect.off("mouseover mouseout");
			break;
	}
}

function resizeGroup(activeAnchor) {
	var group = activeAnchor.getParent();
	var rect = group.get('.rect')[0];
	var topleft = group.get('.topleft')[0];
	var topright = group.get('.topright')[0];
	var bottomright = group.get('.bottomright')[0];
	var bottomleft = group.get('.bottomleft')[0];

	var x = activeAnchor.x(), y = activeAnchor.y();
	// update anchor positions
	switch(activeAnchor.name()) {
		case 'topleft':
			topright.y(y);
			bottomleft.x(x);
			break;
		case 'topright':
			topleft.y(y);
			bottomright.x(x);
			break;
		case 'bottomright':
			topright.x(x);
			bottomleft.y(y);
			break;
		case 'bottomleft':
			topleft.x(x);
			bottomright.y(y);
			break;
	}
	// update rect position
	rect.setPosition(topleft.getPosition());
	rect.setSize({
		width: topright.x() - topleft.x(), 
		height: bottomleft.y() - topleft.y()
	});
}
