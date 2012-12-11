tween
=====

JavaScript tween library supporting bezier curves

Examples
--

property tween
```javascript
  var tween1 = tweenPlayer.to(obj, 60, {x: 100}, {ease: easingFunction, delay: 60});
  var tween2 = tweenPlayer.from(obj, 60, {x: 150, scaleX: 2.0}, {ease: easingFunction, delay: 60});
```
x/y property tween on specified path
```javascript
  var tween3 = tweenPlayer
    .path(obj, 60, {ease: easingFunction})
    .lineTo(10, 150)
    .lineTo(150, 150)
    .moveTo(150, 10)
    .lineTo(10, 10)
    .start();
  var tween4 = tweenPlayer
    .path(obj, 60, {ease: easingFunction})
    .bezierCurveTo(10, 210, 80, 210, 110, 110)
    .bezierCurveTo(130, 10, 210, 10, 210, 210)
    .start();
  var tween5 = tweenPlayer
    .path(obj, 120, {ease:easingFunction, delay: 60})
    .bezierThrough([100,10],[100,100],[10,100],[10, 10],[10, 150],[40,10],[60,150],[80,10],[100,150],[120,75],[10,75])
    .start();
```javascript