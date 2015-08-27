var viewportList = [];
var Viewport = function (args) {
	args = args || {};
	var p = this;
	if (!args.hasOwnProperty('parentElementSelector')) {
		throw new Error('Viewport must be provided a parent element to attach to for scale.');
	}
	p.width = 0;
	p.height = 0;
	p.scene = new THREE.Scene();
	p.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
	p.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
	p.$canvasHolder = $(args.parentElementSelector);
	p.$canvas = $(p.renderer.domElement);
	p.$canvas.viewport = p;
	p.hasPointerInteractivity = args.hasPointerInteractivity || false;
	//NOTE: Null used to denote that property exists, but currently has no value
	p.targetedMesh = null;

	p.ambientLight = new THREE.AmbientLight(0xffffff);
	p.scene.add(p.ambientLight);

	p.$canvasHolder.append(p.renderer.domElement);
	if(p.hasPointerInteractivity){
		p.addPointerInteractivity();
	}
	viewportList.push(p);
};

Viewport.prototype = {
	sizeWindow: function () {
		var p = this;
		p.width = p.$canvasHolder.width();
		p.height = p.$canvasHolder.height();
		p.camera.aspect = p.width / p.height;
		p.camera.updateProjectionMatrix();
		p.renderer.setSize(p.width, p.height);
	},
	render: function () {
		var p = this;
		p.renderer.render(p.scene, p.camera);
		if(p.octree){
			p.octree.update();
		}
	},
	addPointerInteractivity: function(){
		var p = this;
		p.raycaster = new THREE.Raycaster();
		p.mouse = new THREE.Vector2();
		p.octree = new THREE.Octree({
			undeferred: false,
			depthMax: Infinity,
			objectsThreshold: 8,
			overlapPct: 0.15
		});
		p.makeMeshTargetable = function(target){
			p.octree.add(
				target,
				{
					useFaces: true
				}
			);
		};
		p.mouseMoveHandler = function(event){
			p.mouse.x = ( event.offsetX / p.width ) * 2 - 1;
			p.mouse.y = -( event.offsetY / p.height ) * 2 + 1;
			p.raycaster.setFromCamera(p.mouse, p.camera);
			var octreeObjects;
			var numObjects;
			var numFaces = 0;
			var intersections;

			octreeObjects = p.octree.search(p.raycaster.ray.origin, p.raycaster.ray.far, true, p.raycaster.ray.direction);
			intersections = p.raycaster.intersectOctreeObjects(octreeObjects);
			numObjects = octreeObjects.length;
			for(var i = 0, il = numObjects; i < il; i++){
				numFaces += octreeObjects[i].faces.length;
			}
			//console.log(intersections);
			if(intersections.length > 0){
				if(intersections[intersections.length - 1].object != p.targetedMesh){
					if(p.targetedMesh){
						p.targetedMesh.material.opacity = 1;
					}
					p.targetedMesh = intersections[intersections.length - 1].object;
					p.targetedMesh.material.opacity = 0.5;
					activeSpellCursor.position.copy(p.targetedMesh.position);
				}
				p.$canvas.css('cursor', 'pointer');
			}
			else if(p.targetedMesh){
				p.targetedMesh.material.opacity = 1;
				p.targetedMesh = null;
				p.$canvas.css('cursor', 'auto');
			}
		};
		p.canvasClickHandler = function($event){
			var mesh = p.targetedMesh;
			console.log($event, mesh);
			if(mesh && mesh.hasOwnProperty('clickHandler')){
				mesh.clickHandler();
			}
		};
		p.$canvas.on('mousemove', p.mouseMoveHandler);
		p.$canvas.on('mousedown', p.canvasClickHandler);
	}
};

var resizeWindowEventHandler = function () {
		viewportList.forEach(function (item) {
			item.sizeWindow();
		});
	},
	renderAllViews = function () {
		viewportList.forEach(function (item) {
			item.render();
		});
	};

$(document).ready(resizeWindowEventHandler);
$(window).resize(resizeWindowEventHandler);