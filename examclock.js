(function() {
  var canvasApp, currentTimeString, eventWindowLoaded, format, log, makeExam, millis_to_mins, millis_to_secs, mins_to_millis, secs_to_millis;
  log = function(msg) {
    if (typeof console !== "undefined" && console !== null) {
      return console.log(msg);
    }
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
  millis_to_secs = function(m) {
    return m / 1000;
  };
  millis_to_mins = function(m) {
    return (m / 1000) / 60;
  };
  secs_to_millis = function(s) {
    return 1000 * s;
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
    var animationLoop, background, bar, big_msg, canvas, centerLabel, constrain, constrained_map, context, dur_input, dur_span, exam, frame_rate, map, putLabel, running, setup, start_button, start_button_click, yellow;
    if (Modernizr.canvas) {
      log("canvas is supported");
    } else {
      log("canvas is NOT supported");
      return;
    }
    frame_rate = 30;
    yellow = "#ffffaa";
    canvas = document.getElementById("canvasOne");
    context = canvas.getContext("2d");
    exam = null;
    running = false;
    start_button_click = function() {
      log("start button clicked!");
      if (isNaN(dur_input.value) || dur_input.value === "") {
        return alert("Please enter duration in minutes.");
      } else {
        running = true;
        exam = makeExam(parseInt(dur_input.value));
        start_button.style.visibility = "hidden";
        return dur_span.style.visibility = "hidden";
      }
    };
    start_button = document.getElementById("startbutton");
    start_button.onclick = start_button_click;
    dur_input = document.getElementById("dur_in_min");
    dur_input.value = 180;
    dur_span = document.getElementById("dur_span");
    background = function(color) {
      context.fillStyle = color;
      return context.fillRect(0, 0, canvas.width, canvas.height);
    };
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
      strokeStyle: "black",
      lineWidth: 1,
      color: "red"
    };
    animationLoop = function() {
      var erm, pct, pct_msg, pct_msg_width, w;
      background(yellow);
      if (!running) {
        return;
      }
      if (exam.finished()) {
        bar.color = "green";
        big_msg.msg = "Exam is finished!";
        big_msg.color = "green";
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
      centerLabel("Start at " + (format(exam.time.start)) + "                                            End at " + (format(exam.time.end)), 290, "30px serif");
      context.strokeStyle = bar.strokeStyle;
      context.lineWidth = bar.lineWidth;
      context.strokeRect(bar.x, bar.y, bar.width, bar.height);
      context.fillStyle = bar.color;
      erm = exam.remaining.millis();
      w = constrained_map(erm, exam.duration.millis, 0, 0, bar.width);
      context.fillRect(bar.x, bar.y, w, bar.height);
      pct = constrained_map(erm, exam.duration.millis, 0, 0, 100);
      pct_msg = Math.floor(pct) + "% done";
      pct_msg_width = context.measureText(pct_msg).width;
      return putLabel(pct_msg, constrain(w, bar.x, canvas.width - (pct_msg_width + 3)), bar.y + 75);
    };
    setup();
    return setInterval(animationLoop, 1000 / frame_rate);
  };
  eventWindowLoaded = function() {
    return canvasApp();
  };
  window.addEventListener("load", eventWindowLoaded, false);
}).call(this);
