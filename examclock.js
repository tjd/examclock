(function() {
  var canvasApp, constrain, constrained_map, currentTimeString, eventWindowLoaded, format, frame_rate, log, makeExam, map, mins_to_millis, randIntBetween, yellow;
  log = function(msg) {
    if (typeof console !== "undefined" && console !== null) {
      return console.log(msg);
    }
  };
  randIntBetween = function(lo, hi) {
    return Math.floor(Math.random() * (hi - lo + 1) + lo);
  };
  Array.prototype.rand_choice = function() {
    return this[randIntBetween(0, this.length - 1)];
  };
  yellow = "#ffffaa";
  frame_rate = 30;
  map = function(x, a, b, c, d) {
    return c + (d - c) * (x - a) / (b - a);
  };
  constrain = function(x, lo, hi) {
    if (x < lo) {
      return lo;
    } else if (x > hi) {
      return hi;
    } else {
      return x;
    }
  };
  constrained_map = function(x, a, b, c, d) {
    return constrain(map(x, a, b, c, d), c, d);
  };
  format = function(date, include_seconds) {
    var am_pm, h_str, hours, m_str, minutes, s_str, seconds;
    if (include_seconds == null) {
      include_seconds = false;
    }
    hours = date.getHours();
    minutes = date.getMinutes();
    seconds = date.getSeconds();
    am_pm = hours < 12 ? "am" : "pm";
    h_str = hours % 12 === 0 ? "12" : (hours % 12).toString();
    m_str = ":" + (minutes < 10 ? "0" : "") + minutes.toString();
    s_str = include_seconds ? ":" + (seconds < 10 ? "0" : "") + seconds.toString() : "";
    return "" + h_str + m_str + s_str + am_pm;
  };
  currentTimeString = function(include_seconds) {
    if (include_seconds == null) {
      include_seconds = false;
    }
    return format(new Date, include_seconds);
  };
  mins_to_millis = function(m) {
    return 60 * m * 1000;
  };
  makeExam = function(dur_in_min) {
    var exam, future, now;
    now = new Date();
    future = new Date(now.getTime() + mins_to_millis(dur_in_min));
    exam = {
      time: {
        start: now,
        end: future
      },
      duration: {
        millis: mins_to_millis(dur_in_min),
        seconds: 60 * dur_in_min,
        minutes: dur_in_min,
        hours: dur_in_min / 60
      },
      remaining: {
        millis: function() {
          return future.getTime() - (new Date()).getTime();
        },
        seconds: function() {
          return Math.ceil(this.millis() / 1000);
        },
        minutes: function() {
          return Math.ceil(this.seconds() / 60);
        }
      },
      going: function() {
        return !this.finished();
      },
      finished: function() {
        return this.remaining.millis() <= 0;
      }
    };
    return exam;
  };
  canvasApp = function() {
    var Label, animationLoop, background, bar, big_msg, canvas, centerLabel, context, dur_input, dur_span, exam, putLabel, running, scroll, setup, start_button, start_button_click, window_resize;
    if (Modernizr.canvas) {
      log("canvas is supported");
    } else {
      log("canvas is NOT supported");
      return;
    }
    canvas = document.getElementById("canvasOne");
    context = canvas.getContext("2d");
    log("window dimensions: (" + window.innerWidth + ", " + window.innerHeight + ")");
    canvas.width = 0.98 * window.innerWidth;
    canvas.height = 400;
    log("canvas dimensions: (" + canvas.width + ", " + canvas.height + ")");
    exam = null;
    running = false;
    start_button_click = function() {
      if (isNaN(dur_input.value) || dur_input.value === "") {
        return alert("Please enter duration in minutes.");
      } else {
        running = true;
        exam = makeExam(parseInt(dur_input.value));
        bar.set_msg();
        start_button.style.visibility = "hidden";
        return dur_span.style.visibility = "hidden";
      }
    };
    start_button = document.getElementById("startbutton");
    start_button.onclick = start_button_click;
    dur_input = document.getElementById("dur_in_min");
    dur_input.value = 180;
    dur_span = document.getElementById("dur_span");
    window_resize = function() {
      canvas.width = 0.98 * window.innerWidth;
      return bar.resize();
    };
    window.addEventListener("resize", window_resize, false);
    background = function(color) {
      context.fillStyle = color;
      return context.fillRect(0, 0, canvas.width, canvas.height);
    };
    Label = (function() {
      function Label(msg, x, y, style, font, visible) {
        this.msg = msg != null ? msg : "<label>";
        this.x = x != null ? x : 0;
        this.y = y != null ? y : 0;
        this.style = style != null ? style : 'black';
        this.font = font != null ? font : '25px serif';
        this.visible = visible != null ? visible : true;
      }
      Label.prototype.getWidthInPixels = function() {
        var w;
        context.save();
        context.font = this.font;
        context.fillStyle = this.style;
        w = context.measureText(this.msg).width;
        context.restore();
        return w;
      };
      Label.prototype.lowercaseMwidth = function() {
        var w;
        context.save();
        context.font = this.font;
        context.fillStyle = this.style;
        w = context.measureText("m").width;
        context.restore();
        return w;
      };
      Label.prototype.uppercaseMwidth = function() {
        var w;
        context.save();
        context.font = this.font;
        context.fillStyle = this.style;
        w = context.measureText("M").width;
        context.restore();
        return w;
      };
      Label.prototype.getHeightInPixels = function() {
        return this.lowercaseMwidth();
      };
      Label.prototype.render = function() {
        if (!this.visible) {
          return;
        }
        context.save();
        context.font = this.font;
        context.fillStyle = this.style;
        context.fillText(this.msg, this.x, this.y);
        return context.restore();
      };
      return Label;
    })();
    putLabel = function(msg, x, y, font, style) {
      if (x == null) {
        x = 25;
      }
      if (y == null) {
        y = 25;
      }
      if (font == null) {
        font = '25px serif';
      }
      if (style == null) {
        style = 'black';
      }
      context.font = font;
      context.fillStyle = style;
      return context.fillText(msg, x, y);
    };
    centerLabel = function(msg, y, font, style) {
      var dim, x;
      if (y == null) {
        y = 25;
      }
      if (font == null) {
        font = '25px serif';
      }
      if (style == null) {
        style = 'black';
      }
      context.font = font;
      context.fillStyle = style;
      dim = context.measureText(msg);
      x = (canvas.width - dim.width) / 2;
      return context.fillText(msg, x, y);
    };
    setup = function() {
      return background(yellow);
    };
    big_msg = {
      msg: "",
      y: 175,
      font: "90px serif",
      color: "blue"
    };
    bar = {
      x: 30,
      y: 300,
      width: canvas.width - 60,
      height: 50,
      resize: function() {
        this.width = canvas.width - 60;
        this.height = 50;
        return this.set_msg();
      },
      strokeStyle: "black",
      lineWidth: 1,
      color: "red",
      set_msg: function() {
        this.start_msg = new Label("Start at " + (format(exam.time.start)), bar.x, bar.y - 10);
        this.end_msg = new Label("End at " + (format(exam.time.start)), -1, bar.y - 10);
        return this.end_msg.x = this.width - this.end_msg.getWidthInPixels() + 25;
      },
      start_msg: "<start_msg>",
      end_msg: "<end_msg>"
    };
    scroll = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      last_change: (new Date).getTime(),
      sit_time: 30 * 1000,
      hide_time: 5 * 1000,
      state: "hiding",
      possible_states: ["finished", "descending", "ascending", "sitting", "hiding"],
      draw: function() {
        if (this.state !== "hiding") {
          return centerLabel(this.msg, this.y);
        }
      },
      update: function() {
        var now, t;
        now = (new Date).getTime();
        t = now - this.last_change;
        switch (this.state) {
          case "finished":
            this.dx = 0;
            this.dy = 0;
            this.y = 50;
            this.msg = "Hand in your exam!";
            break;
          case "sitting":
            this.dx = 0;
            this.dy = 0;
            if (t > this.sit_time) {
              this.state = "ascending";
              this.last_change = now;
            }
            break;
          case "hiding":
            this.dx = 0;
            this.dy = 0;
            if (t > this.hide_time) {
              this.state = "descending";
              this.last_change = now;
              this.msg = this.messages.rand_choice();
            }
            break;
          case "descending":
            this.dx = 0;
            this.dy = 1;
            if (this.y >= 50) {
              this.y = 50;
              this.state = "sitting";
              this.last_change = now;
            }
            break;
          case "ascending":
            this.dx = 0;
            this.dy = -1;
            if (this.y <= 0) {
              this.y = 0;
              this.state = "hiding";
              this.last_change = now;
            }
        }
        this.x += this.dx;
        return this.y += this.dy;
      },
      msg: "<msg>",
      reset: function() {
        this.msg = this.messages.rand_choice();
        this.x = canvas.width + 10;
        return this.y = 50;
      },
      messages: ["Put your name and SFU student ID # on each page.", "Raise your hand if you have a question or need to use the washroom.", "Read the questions carefully.", "Double-check your answers if you have time.", "Have mercy on your marker: write neatly!", "Pay attention to the details.", "Relax. Stay calm. Chill.", "Think!"]
    };
    animationLoop = function() {
      var millis_left, pct, pct_msg, pct_msg_width, w;
      background(yellow);
      if (!running) {
        return;
      }
      if (exam.finished()) {
        bar.color = "green";
        big_msg.msg = "Exam is finished!";
        big_msg.color = "green";
        scroll.state = "finished";
      } else if (exam.remaining.minutes() <= 1) {
        bar.color = "red";
        big_msg.msg = exam.remaining.seconds() + " seconds left";
        big_msg.color = "red";
      } else if (exam.remaining.minutes() <= 10) {
        bar.color = "orange";
        big_msg.msg = exam.remaining.minutes() + " minutes left";
        big_msg.color = "orange";
      } else {
        bar.color = "blue";
        big_msg.msg = exam.remaining.minutes() + " minutes left";
        big_msg.color = "blue";
      }
      centerLabel(big_msg.msg, big_msg.y, big_msg.font, big_msg.color);
      centerLabel(currentTimeString(true), 210, "30px serif");
      bar.start_msg.render();
      bar.end_msg.render();
      context.strokeStyle = bar.strokeStyle;
      context.lineWidth = bar.lineWidth;
      context.strokeRect(bar.x, bar.y, bar.width, bar.height);
      context.fillStyle = bar.color;
      millis_left = exam.remaining.millis();
      w = constrained_map(millis_left, exam.duration.millis, 0, 0, bar.width);
      context.fillRect(bar.x, bar.y, w, bar.height);
      pct = constrained_map(millis_left, exam.duration.millis, 0, 0, 100);
      pct_msg = Math.floor(pct) + "% done";
      pct_msg_width = context.measureText(pct_msg).width;
      putLabel(pct_msg, constrain(w, bar.x, canvas.width - (pct_msg_width + 3)), bar.y + 75);
      scroll.draw();
      return scroll.update();
    };
    setup();
    return setInterval(animationLoop, 1000 / frame_rate);
  };
  eventWindowLoaded = function() {
    return canvasApp();
  };
  window.addEventListener("load", eventWindowLoaded, false);
}).call(this);
