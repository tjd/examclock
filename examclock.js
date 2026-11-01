// examclock.js
//
// An HTML5 canvas-based timer for midterm and final exams. Plain JavaScript,
// no build step: edit this file directly.

"use strict";

(() => {
    const log = (msg) => console.log(msg);

    // includes endpoints: both lo and hi could be returned
    const randIntBetween = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1) + lo);

    // return a random element of an array
    const randChoice = (arr) => arr[randIntBetween(0, arr.length - 1)];

    //
    // yellow is a nice color
    //
    const yellow = "#ffffaa";

    //
    // animation frame rate
    //
    const frame_rate = 30;

    //
    // proportionally map x from range [a, b] to range [c, d]
    //
    const map = (x, a, b, c, d) => c + (d - c) * (x - a) / (b - a);

    //
    // ensure x is in the range [lo, hi]
    //
    const constrain = (x, lo, hi) => Math.min(Math.max(x, lo), hi);

    //
    // proportionally map x from range [a, b] to range [c, d],
    // and always return a value in [c, d]
    //
    const constrained_map = (x, a, b, c, d) => constrain(map(x, a, b, c, d), c, d);

    //
    // simple time formatting, e.g. "2:05pm" or "2:05:09pm"
    //
    const formatTime = (date, include_seconds = false) => {
        const hours = date.getHours();      // 0-23
        const minutes = date.getMinutes();  // 0-59
        const seconds = date.getSeconds();  // 0-59

        const am_pm = hours < 12 ? "am" : "pm";
        const h_str = hours % 12 === 0 ? "12" : (hours % 12).toString();
        const m_str = ":" + String(minutes).padStart(2, "0");
        const s_str = include_seconds ? ":" + String(seconds).padStart(2, "0") : "";

        return `${h_str}${m_str}${s_str}${am_pm}`;
    };

    const currentTimeString = (include_seconds = false) => formatTime(new Date(), include_seconds);

    const mins_to_millis = (m) => 60 * m * 1000;

    const makeExam = (dur_in_min) => {
        const now = new Date();
        const future = new Date(now.getTime() + mins_to_millis(dur_in_min));
        return {
            time: {
                start: now,
                end: future,
            },
            duration: {
                millis: mins_to_millis(dur_in_min),
                seconds: 60 * dur_in_min,
                minutes: dur_in_min,
                hours: dur_in_min / 60,
            },
            remaining: {
                millis() { return future.getTime() - Date.now(); },
                seconds() { return Math.ceil(this.millis() / 1000); },
                minutes() { return Math.ceil(this.seconds() / 60); },
            },
            going() { return !this.finished(); },
            finished() { return this.remaining.millis() <= 0; },
        };
    };

    const raw_label = (context, canvas) => ({
        make: (obj) => ({
            context,
            msg: obj.msg ?? "<label_msg>",
            x: obj.x ?? 100,
            y: obj.y ?? 100,
            style: obj.style ?? "black",
            font: obj.font ?? "25px serif",
            visible: obj.visible ?? true,
            measure(text) {
                this.context.save();
                this.context.font = this.font;
                this.context.fillStyle = this.style;
                const w = this.context.measureText(text).width;
                this.context.restore();
                return w;
            },
            getWidthInPixels() { return this.measure(this.msg); },
            uppercaseMwidth() { return this.measure("M"); },
            getHeightInPixels() { return this.uppercaseMwidth(); },
            render() {
                if (!this.visible) return;
                this.context.save();
                this.context.font = this.font;
                this.context.fillStyle = this.style;
                this.context.fillText(this.msg, this.x, this.y);
                this.context.restore();
            },
        }),

        put(msg, x = 25, y = 25, font = "25px serif", style = "black") {
            context.font = font;
            context.fillStyle = style;
            context.fillText(msg, x, y);
        },

        center(msg, y = 25, font = "25px serif", style = "black") {
            context.font = font;
            context.fillStyle = style;
            const x = (canvas.width - context.measureText(msg).width) / 2;
            context.fillText(msg, x, y);
        },
    });

    const canvasApp = () => {
        //
        // get the canvas and its context
        //
        const canvas = document.getElementById("canvasOne");
        if (!canvas.getContext) {
            log("canvas is NOT supported");
            return;
        }
        const context = canvas.getContext("2d");

        canvas.width = 0.98 * window.innerWidth;
        canvas.height = 400;

        //
        // make the label object
        //
        const label = raw_label(context, canvas);

        //
        // set event handlers and other variables
        //
        const start_button = document.getElementById("startbutton");
        const dur_input = document.getElementById("dur_in_min");
        const dur_span = document.getElementById("dur_span");
        dur_input.value = 180;

        let exam = null;

        start_button.onclick = () => {
            if (isNaN(dur_input.value) || dur_input.value === "") {
                alert("Please enter duration in minutes.");
                return;
            }
            exam = makeExam(parseInt(dur_input.value, 10));
            bar.set_msg();
            start_button.style.visibility = "hidden";
            dur_span.style.visibility = "hidden";

            // start the animation loop
            setInterval(animationLoop, 1000 / frame_rate);
        };

        window.addEventListener("resize", () => {
            canvas.width = 0.98 * window.innerWidth;
            bar.resize();
            // the canvas is cleared on resize, so repaint it before the exam starts
            if (exam === null) background(yellow);
        });

        //
        // helper functions
        //
        const background = (color) => {
            context.fillStyle = color;
            context.fillRect(0, 0, canvas.width, canvas.height);
        };

        background(yellow);

        //
        // large message text info
        //
        const big_msg = {
            msg: "",
            y: 175,
            font: "90px serif",
            color: "blue",
        };

        //
        // progress bar info
        //
        const bar = {
            x: 30,
            y: 300,
            width: canvas.width - 60,
            height: 50,
            resize() {
                this.width = canvas.width - 60;
                this.height = 50;
                if (exam !== null) this.set_msg();
            },
            strokeStyle: "black",
            lineWidth: 1,
            color: "red",
            set_msg() {
                this.start_msg = label.make({ msg: `Start at ${formatTime(exam.time.start)}`, x: this.x, y: this.y - 10 });
                this.end_msg = label.make({ msg: `End at ${formatTime(exam.time.end)}`, x: -1, y: this.y - 10 });
                this.end_msg.x = this.width - this.end_msg.getWidthInPixels() + 25;
            },
            start_msg: null,
            end_msg: null,
        };

        //
        // text scroll
        //
        const scroll = {
            x: 0,
            y: 0,
            dx: 0,
            dy: 0,
            last_change: Date.now(),
            sit_time: 30 * 1000,  // milliseconds
            hide_time: 5 * 1000,
            state: "hiding",  // one of: finished, descending, ascending, sitting, hiding
            draw() {
                if (this.state !== "hiding") label.center(this.msg, this.y);
            },
            update() {
                const now = Date.now();
                const t = now - this.last_change;
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
                            this.msg = randChoice(this.messages);
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
                        break;
                }
                this.x += this.dx;
                this.y += this.dy;
            },
            msg: "<msg>",
            messages: [
                "Put your name and SFU student ID # on each page.",
                "Raise your hand if you have a question or need to use the washroom.",
                "Read the questions carefully.",
                "Double-check your answers if you have time.",
                "Have mercy on your marker: write neatly!",
                "Pay attention to the details.",
                "Relax. Stay calm. Chill.",
                "Think!",
            ],
        };

        const animationLoop = () => {
            background(yellow);

            //
            // set colors and messages based on time remaining
            //
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

            //
            // draw the time remaining, current time, and start/end time labels
            //
            label.center(big_msg.msg, big_msg.y, big_msg.font, big_msg.color);
            label.center(currentTimeString(true), 210, "30px serif");
            bar.start_msg.render();
            bar.end_msg.render();

            //
            // progress bar
            //
            context.strokeStyle = bar.strokeStyle;
            context.lineWidth = bar.lineWidth;
            context.strokeRect(bar.x, bar.y, bar.width, bar.height);

            context.fillStyle = bar.color;

            // w is the width of the progress bar
            const millis_left = exam.remaining.millis();
            const w = constrained_map(millis_left, exam.duration.millis, 0, 0, bar.width);
            context.fillRect(bar.x, bar.y, w, bar.height);

            // calculate and display the % completed
            const pct = constrained_map(millis_left, exam.duration.millis, 0, 0, 100);
            const pct_msg = Math.floor(pct) + "% done";
            const pct_msg_width = context.measureText(pct_msg).width;
            label.put(pct_msg, constrain(w, bar.x, canvas.width - (pct_msg_width + 3)), bar.y + 75);

            //
            // scroll bar
            //
            scroll.draw();
            scroll.update();
        };
    };

    //
    // The "load" event occurs when the HTML page finishes loading.
    //
    window.addEventListener("load", canvasApp);
})();
