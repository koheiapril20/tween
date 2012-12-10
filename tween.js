(function(w) {

	var defaults = function(obj) {
		var i, l, source, sources = Array.prototype.slice.call(arguments, 1), prop;
		for (i = 0, l = sources.length; i < l; i++) {
			source = sources[i];
			for (prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
		}
		return obj;
	};

	var TweenPlayer = (function() {
		function TweenPlayer(options) {
			var self = this;
			self.currentFrame = 0;
			self._tweenDictionary = {};
			self._tweenDictionaryNum = 0;
			self._targetList = [];
			self._complete = null;
		};
		TweenPlayer.prototype = {
			init: function(options) {
				var self = this;
				self.options = options || {};
				if (self.options['default']) {
					TweenPlayer._defaultPlayer = self;
				}
			},
			register: function(tween) {
				var self = this;
				defaults(tween.options, self.options);
				tween.startFrame = self.currentFrame + tween.delay;
				var id = tween.target._tweenID;
				var container = self._tweenDictionary[
					id || (tween.target._tweenID = id = 't' + (self._tweenDictionaryNum++))];
				if (!container) {
					self._tweenDictionary[id]	= container = {target: tween.target, tweens: []};
					self._targetList.push(container);
				}
				container.tweens.unshift(tween);
			},
			proceed: function() {
				var self = this, i, il, j, jl, applied, tween, container;
				self.currentFrame++;
				for (i = 0, il = self._targetList.length; i < il; i++) {
					container = self._targetList[i];
					if (!container) {
						continue;
					}
					for (j = 0, jl = container.tweens.length; j < jl; j++) {
					tween = container.tweens[j];
						if (!tween) {
							continue;
						}
						if (tween.release) {
							container.tweens.splice(j, 1);
							if (container.tweens.length === 0) {
								self._targetList.splice(i, 1);
								delete self._tweenDictionary[container.target._tweenID];
								delete container.target._tweenID;
								if (self._complete && self._targetList.length === 0) {
									self._complete.apply(this);
									self._complete = null;
								}
							}
							continue;
						}
						applied = tween.update(self.currentFrame);		
						if (applied) {
							break;
						}
					}
				}
			},
			to: function(target, duration, vars, options) {
				var self = this;
				var tween = new Tween(target, duration, vars, options);
				self.register(tween);
				return tween;
			},
			path: function(target, duration, options) {
				var self = this, path = new Path(), i,l, info, method;
				path.moveTo(target.x, target.y);
				path._currentPoint = [target.x, target.y];
				options['path'] = path;
				path.onStart = function() {
					var tween = new Tween(target, duration, {}, options);
					self.register(tween);
					return tween;
				};
				return path;
			},
			complete: function(callback) {
				var self = this;
				if (typeof callback === 'function') {
					self._complete = callback;
				}
			}
		};
		return TweenPlayer;
	})();

	var Tween = (function() {
		function Tween(target, duration, vars, options) {
			var self = this, player;
			self.target = target;
			self.startFrame = null;
			self.duration = duration > 0 ? duration : 1;
			self.vars = vars || {};
			self.options = options || {};
			self.ratio = 0;
			self.initVars = null;
			self.ease = self.options['ease'] || function linear(t) {return t;};
			self.delay = self.options['delay'] || 0;
			self.release = false;
			self.complete = self.options['complete'];
			self.path = self.options['path'];
		};
		Tween.prototype = {
			update: function(time) {
				var self = this, prop;
				if (time < self.startFrame) {
					return false;
				}
				if (!self.initVars) {
					self.initVars = {};
					for (prop in self.vars) {
						self.initVars[prop] = self.target[prop] || 0;
					}
				}
				var t = (time - self.startFrame) / self.duration;
				if (t === 1) {
					self.release = true;
					if (self.complete && typeof self.complete === 'function') {
						self.complete.apply(self);
					}
				} else if (t > 1) {
					return false;
				}
				self.ratio = self.ease(t);
				if (self.path) {
					var currentPath, currentLength = 0, 
					endLength = self.ratio * self.path.length, 
					l = self.path.paths.length, i = 0, diff, segmentRatio, x, y;
					do {
						currentPath = self.path.paths[i%l];
						if (endLength < 0) {
							i+=l-1;
						} else {
							i++;
						}
						currentLength += currentPath.length;
						diff = endLength - currentLength;
					}	while(diff > 0);
					segmentRatio = (diff + currentPath.length) / currentPath.length;
					if (currentPath.type === Path.TYPE_LINE) {
						var prev = currentPath.prev;
						var startX = prev === null ? self.path.paths[l-1].dest[0] : prev.dest[0];
						var startY = prev === null ? self.path.paths[l-1].dest[1] : prev.dest[1];
						x = (currentPath.dest[0] - startX) * segmentRatio + startX;
						y = (currentPath.dest[1] - startY) * segmentRatio + startY;
					} else if (currentPath.type === Path.TYPE_MOVE) {
						x = currentPath.dest[0];
						y = currentPath.dest[1];
					} else if (currentPath.type === Path.TYPE_BEZIER) {
						var bezier = currentPath.bezier;
						var iv = bezier.getInterveningVariableByRatio(segmentRatio);
						x = bezier.getX(iv);
						y = bezier.getY(iv);
					}
					self.target.x = x;
					self.target.y = y;
				} else {
					for (prop in self.vars) {
						self.target[prop] = 
								(self.vars[prop] - self.initVars[prop]) * self.ratio + self.initVars[prop];
					}
				}
				if (self.options.after) {
					self.options.after.call(this, self.target);
				}
				return true;
			},
			cancel: function() {
				this.release = true;
			}
		};
		return Tween;
	})();

	var Path = (function() {
		function Path() {
			var self = this;
			self.paths = [];
			self.length = 0;
			self._prev = null;
			self.onStart = null;
			self._currentPoint = null;
		}
		Path.TYPE_MOVE = 0;
		Path.TYPE_LINE = 1;
		Path.TYPE_BEZIER = 2;
		Path.prototype = {
			moveTo: function(x, y) {
				var self = this;
				var path = {type: Path.TYPE_MOVE, dest: [x, y], length: 0, prev: self._prev};
				self.paths.push(path);
				self._prev = path;
				self._currentPoint = [x, y];
				return self;
			},
			lineTo: function(x, y) {
				var self = this;
				var prevX = self._prev.dest[0];
				var prevY = self._prev.dest[1];
				var length = Math.sqrt((x-prevX)*(x-prevX)+(y-prevY)*(y-prevY));
				self.length += length;
				var path = {type: Path.TYPE_LINE, dest: [x, y], length: length, prev: self._prev};
				self._prev = path;
				self._currentPoint = [x, y];
				return self;
			},
			bezierCurveTo: function(cp1x, cp1y, cp2x, cp2y, x, y, options) {
				var self = this, length;
				var prevX = self._prev.dest[0];
				var prevY = self._prev.dest[1];
				var bezier = new BezierCurve(prevX, prevY, cp1x, cp1y, cp2x, cp2y, x, y, 0.025, options);
				length = bezier.length;
				self.length += length;
				var path = {type: Path.TYPE_BEZIER, dest:[x, y], length: length, bezier: bezier, prev: self._prev};
				this.paths.push(path);
				self._prev = path;
				self._currentPoint = [x, y];
				return self;
			},
			bezierThrough: function() {
				// ported from http://www.codeproject.com/Articles/31859/Draw-a-Smooth-Curve-through-a-Set-of-2D-Points-wit
				var self = this, i, l, segments = [], seg, n, 
				cp1, cp2, rhs = [], cp1XArray = [], cp1YArray = [],
				points = Array.prototype.slice.apply(arguments);
				var getFirstControlPoints = function(rhs) {
					var n = rhs.length;
					var x = []; // Solution vector.
					var tmp = []; // Temp workspace.
					var b = 2.0;
					var i;
					x[0] = rhs[0] / b;
					for (i = 1; i < n; i++) // Decomposition and forward substitution.
					{
						tmp[i] = 1 / b;
						b = (i < n - 1 ? 4.0 : 3.5) - tmp[i];
						x[i] = (rhs[i] - x[i - 1]) / b;
					}
					for (i = 1; i < n; i++) {
						x[n - i - 1] -= tmp[n - i] * x[n - i]; // Backsubstitution.							
					}
					return x;
				};
				// add first point
				points.unshift(self._currentPoint);
				l = points.length;
				n = l - 1;
				if (n < 1) {
					throw "invalid argument";
				}
				if (n === 1) {
					// Special case: Bezier curve should be a straight line.
					cp1 =  [(2 * points[0][0] + points[1][0]) / 3, (2 * points[0][1] + points[1][1]) / 3];
					cp2 =  [2 * cp1[0][0] - points[0][0], 2 * cp1[0][1] - points[0][1]];
					segments.push([points[0], cp1, cp2, points[1]]);
				} else {
					// Right hand side vector
					for (i = 1; i < n - 1; i++) {
						rhs[i] = 4 * points[i][0] + 2 * points[i+1][0];
					}
					rhs[0] = points[0][0] + 2 * points[1][0];
					rhs[n - 1] = (8 * points[n-1][0] + points[n][0]) / 2.0;
					cp1XArray = getFirstControlPoints(rhs);
					for (i = 1; i < n - 1; i++) {
						rhs[i] = 4 * points[i][1] + 2 * points[i+1][1];
					}
					rhs[0] = points[0][1] + 2 * points[1][1];
					rhs[n - 1] = (8 * points[n-1][1] + points[n][1]) / 2.0;
					cp1YArray = getFirstControlPoints(rhs);
					for (i = 0; i < n; i++) {
						cp1 = [cp1XArray[i], cp1YArray[i]];
						if (i < n - 1) {
							cp2 = [2 * points[i+1][0] - cp1XArray[i+1], 2 * points[i+1][1] - cp1YArray[i+1]];
						} else {
							cp2 = [(points[n][0] - cp1XArray[n-1]) / 2, (points[n][1] - cp1YArray[n-1]) / 2];
						}
						segments.push([points[i], cp1, cp2, points[i+1]]);						
					}
				}
				// register all segments as bezier curves
				for (i = 0; i < n; i++) {
					seg = segments[i];
					self.bezierCurveTo(seg[1][0],seg[1][1],seg[2][0],seg[2][1],seg[3][0],seg[3][1], {});
				}
				self._currentPoint = points[points.length-1];
				return self;
			},
			start: function() {
				var self = this;
				return self.onStart();
			}
		};
		return Path;
	})();

	var BezierCurve = (function() {
		function BezierCurve(x0, y0, x1, y1, x2, y2, x3, y3, dt, options) {
			var self = this;
			self.options = options || {};
			self.dt = dt;
			self.ax = 3 * x1 + x3 - 3 * x2 - x0;
			self.bx = 3 * (x0 - 2 * x1 + x2);
			self.cx = 3 * (x1 - x0);
			self.dx = x0;
			self.ay = 3 * y1 + y3 - 3 * y2 - y0;
			self.by = 3 * (y0 - 2 * y1 + y2);
			self.cy = 3 * (y1 - y0);
			self.dy = y0;
			self._lengthCache = [];
			self.length = self._calcLength(1, self.dt);
		}
		BezierCurve.prototype = {
			getX: function(t, t2, t3) {
				t2 = t2 || t * t;
				t3 = t3 || t2 * t;
				return this.ax * t3 + this.bx * t2 + this.cx * t + this.dx;
			},
			getY: function(t, t2, t3) {
				t2 = t2 || t * t;
				t3 = t3 || t2 * t;
					return this.ay * t3 + this.by * t2 + this.cy * t + this.dy;
			},
			getDiffX: function(t, t2) {
				t2 = t2 || t * t;
				return 3 * this.ax * t2 + 2 * this.bx * t + this.cx;
			},
			getDiffY: function(t, t2) {
				t2 = t2 || t * t;
				return 3 * this.ay * t2 + 2 * this.by * t + this.cy;
			},
			_calcLength: function(t, dt) {
				var self = this, t2 = t * t;
				var result = null;
				if (t <= 0) {
					return 0;
				}
				var diffX = this.getDiffX(t, t2);
				var diffY = this.getDiffY(t, t2);
				var diff = Math.sqrt(diffX * diffX + diffY * diffY) * dt;
				if (t <= dt) {
					result = diff;
				}
				result = diff + self._calcLength(t - dt, dt);
				self._lengthCache.push(diff);
				return result;
			},
			getInterveningVariableByRatio: function(ratio) {
				var self = this, currentLength = 0, i = 0, l = self._lengthCache.length, t = 0, offset;
				if (self.options['noLengthCalc']) {
					return ratio;	
				}
				while(currentLength / self.length < ratio && i < l) {
					currentLength += self._lengthCache[i++];
				}
				offset = (currentLength - self.length * ratio) / self._lengthCache[i-1];
				t = (i - offset) / l;
				return t;
			}
		};
		return BezierCurve;
	})();

	w.tween = {
		TweenPlayer: TweenPlayer
	};

})(window);