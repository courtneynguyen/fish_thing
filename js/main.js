var fishport = new Viewport({parentElementSelector: '#canvas-holder'});
fishport.camera.position.z = 10;

var onProgress = function ( xhr ) {
	if ( xhr.lengthComputable ) {
		var percentComplete = xhr.loaded / xhr.total * 100;
		console.log( Math.round(percentComplete, 2) + '% downloaded' );
	}
};

var onError = function ( xhr ) {
};

var loader = new THREE.OBJMTLLoader();
loader.load( 'models/fish.obj', 'models/fish.mtl', function ( object ) {

	object.update = function(time){
		this.rotation.y = time * 0.005;
	};
	objectsToUpdate.push(object);
	fishport.scene.add( object );


}, onProgress, onError );

var objectsToUpdate = [],
	render = function(time){
		if(go){
			requestAnimationFrame(render);
		}
		objectsToUpdate.forEach(function(item){
			item.update(time);
		});
		renderAllViews();
	},
	go = true,
	start = function(){
		go = true;
		requestAnimationFrame(render);
	},
	stop = function(){
		go = false;
	};

start();