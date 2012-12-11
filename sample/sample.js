$.ready(function() {
	var tweenPlayer = new tween.TweenPlayer();
	tweenPlayer.init(
		{
			delta: 0.1,
			default: true,
			after: function(target) {
				target.x = ~~(target.x);
				target.y = ~~(target.y);
				target.update();
			}
		});
	var stage = tofu.createStage({width:320,height:360,frameRate:20});
	stage.show('#main');
	
	var createCircle = function(style) {
		var obj = tofu.createGraphics({
			width: 20, height: 20, x:10, y:10
		});
		var g = obj.graphics;
		g.beginPath();
		g.fillStyle = style;
		g.arc(10, 10, 10, 0, Math.PI*2, true); 
		g.closePath();
		g.fill();
		obj.update(true);
		return obj;
	};
	var obj1 = createCircle('rgb(0, 0, 0)');
	stage.add(obj1);
	var obj2 = createCircle('rgb(192, 80, 77)');
	stage.add(obj2);
	var obj3 = createCircle('rgb(155, 187, 89)');
	stage.add(obj3);

	var tween1 = tweenPlayer
			.path(obj1, 60, {ease: createjs.Ease.quadOut})
			.lineTo(10, 150)
			.lineTo(150, 150)
			.moveTo(150, 10)
			.lineTo(10, 10)
			.start();
	var tween2 = tweenPlayer
			.path(obj2, 60, {ease: createjs.Ease.quadOut})
			.bezierCurveTo(10, 210, 80, 210, 110, 110)
			.bezierCurveTo(130, 10, 210, 10, 210, 210)
			.start();
	var tween3 = tweenPlayer.to(obj3, 60, {x: 150}, {ease: createjs.Ease.quadOut});
	var tween4 = tweenPlayer.from(obj3, 60, {y: 150}, {ease: createjs.Ease.quadOut, delay: 60});
	var tween5 = tweenPlayer
			.path(obj2, 120, {ease:createjs.Ease.quadOut, delay: 60})
			.bezierThrough([100,10],[100,100],[10,100],[10, 10],[10, 150],[40,10],[60,150],[80,10],[100,150],[120,75],[10,75])
			.start();
	setTimeout(function() {
//		tween1.cancel();
	}, 3000);
	stage.on('enterframe', function() {
		tweenPlayer.proceed();
	});

});