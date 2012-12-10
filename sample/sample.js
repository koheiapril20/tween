$.ready(function() {
  var tweenPlayer = new tween.TweenPlayer();
  tweenPlayer.init(
    {
    default: true,
      after: function(target) {
        target.x = ~~(target.x);
        target.y = ~~(target.y);
        target.update();
      }
    });
  var stage = tofu.createStage({width:320,height:360,frameRate:20});
  stage.show('#main');
  var obj1 = tofu.createGraphics({
    width: 20, height: 20, x:10, y:10
  });
  var g = obj1.graphics;
  g.beginPath();
  g.arc(10, 10, 10, 0, Math.PI*2, true); 
  g.closePath();
  g.fill();
  obj1.update(true);
  stage.add(obj1);
  var obj2 = tofu.createGraphics({
    width: 20, height: 20, x:10, y:10
  });
  var g2 = obj2.graphics;
  g2.beginPath();
  g2.fillStyle = 'rgb(192, 80, 77)';
  g2.arc(10, 10, 10, 0, Math.PI*2, true); 
  g2.closePath();
  g2.fill();
  obj2.update(true);
  stage.add(obj2);
  var tween1 = tweenPlayer
			.path(obj1, 60, {ease: createjs.Ease.linear})
			.bezierCurveTo(10, 210, 80, 210, 110, 110)
			.bezierCurveTo(130, 10, 210, 10, 210, 210)
			.start();
  var tween2 = tweenPlayer
			.path(obj2, 60, {ease: createjs.Ease.linear})
			.bezierCurveTo(10, 210, 80, 210, 110, 110, {noLengthCalc: true})
			.bezierCurveTo(130, 10, 210, 10, 210, 210, {noLengthCalc: true})
			.start();
	var tween3 = tweenPlayer
			.path(obj1, 120, {ease:createjs.Ease.quadOut, delay: 60})
			.bezierThrough([100,10],[100,100],[10,100],[10, 10],[10, 150],[40,10],[60,150],[80,10],[100,150],[120,75],[10,75])
			.start();
  setTimeout(function() {
		tween1.cancel();
  }, 3000);
  stage.on('enterframe', function() {
    tweenPlayer.proceed();
  });
  

});