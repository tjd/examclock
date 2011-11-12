# examclock.coffee

#
# A nice way to compile this is as follows::
#
#   coffee --watch --compile examclock.coffee
#
# Every time examclock.coffee changes, examclock.js is automatically
# compiled.
#

#
# Firefox does not have a console object by default.
# If you install Firebug, however, you will get one. So do that.
#
log = (msg) -> console.log(msg) if console?

#
# From JavaScript: The Good Parts
#
Function.prototype.add_method = (name, fn) ->
    @prototype[name] = fn
    return this

#
# Adds function currying, e.g.
#
#    add1 = add.curry(1)
#    log(add1(6))  # 7
#
curry_fn = ->
    slice = Array.prototype.slice
    args = slice.apply(arguments)
    that = this
    return ->
        that.apply(null, args.concat(slice.apply(arguments)))

Function.add_method('curry', curry_fn)

# includes endpoints: both lo and hi could be returned
randIntBetween = (lo, hi) -> Math.floor(Math.random() * (hi - lo + 1) + lo)

# return a random element of an array
Array.prototype.rand_choice = -> this[randIntBetween(0, this.length - 1)]

#
# yellow is a nice color
#
yellow = "#ffffaa"

#
# animation frame rate
#
frame_rate = 30

#
# proportionally map x from range [a, b] to range [c, d]
#
map = (x, a, b, c, d) -> c + (d - c) * (x - a) / (b - a)

#
# ensure x is in the range [lo, hi]
#
constrain = (x, lo, hi) ->
    if x < lo
        lo
    else if x > hi
        hi
    else
        x

#
# proportionally map x from range [a, b] to range [c, d],
# and always return a value in [c, d]
#
constrained_map = (x, a, b, c, d) -> constrain(map(x, a, b, c, d), c, d)

#
# simple time formatting
#
Date.prototype.format = (include_seconds=false) ->
    hours = @getHours()      # 0-23
    minutes = @getMinutes()  # 0-59
    seconds = @getSeconds()  # 0-59

    am_pm = if hours < 12 then "am" else "pm"
    h_str = if hours % 12 == 0
               "12"
            else
               (hours % 12).toString()
    m_str = ":" + (if minutes < 10 then "0" else "") + minutes.toString()
    s_str = if include_seconds
               ":" + (if seconds < 10 then "0" else "") + seconds.toString()
            else
               ""

    return "#{h_str}#{m_str}#{s_str}#{am_pm}"

currentTimeString = (include_seconds=false) -> (new Date).format(include_seconds)

mins_to_millis = (m) -> 60 * m * 1000

makeExam = (dur_in_min) ->
    now = new Date
    future = new Date(now.getTime() + mins_to_millis(dur_in_min))
    exam =
        time:
            start: now
            end: future
        duration:
            millis: mins_to_millis(dur_in_min)
            seconds: 60 * dur_in_min
            minutes: dur_in_min
            hours: dur_in_min / 60
        remaining:
            millis: -> future.getTime() - (new Date()).getTime()
            seconds: -> Math.ceil(@millis() / 1000)
            minutes: -> Math.ceil(@seconds() / 60)

        going: -> not @finished()
        finished: -> @remaining.millis() <= 0

    return exam

raw_label = (context, canvas) ->
    make: (obj) ->
        lbl =
            context: context
            msg: obj.msg ? "<label_msg>"
            x: obj.x ? 100
            y: obj.y ? 100
            style: obj.style ? "black"
            font: obj.font ? "25px serif"
            visible: obj.visible ? true
            getWidthInPixels: ->
                @context.save()
                @context.font = @font
                @context.fillStyle = @style
                w = @context.measureText(@msg).width
                @context.restore()
                return w
            uppercaseMwidth: ->
                @context.save()
                @context.font = @font
                @context.fillStyle = @style
                w = @context.measureText("M").width
                @context.restore()
                return w
            getHeightInPixels: -> @lowercaseMwidth()
            render: ->
                return if not @visible
                @context.save()
                @context.font = @font
                @context.fillStyle = @style
                @context.fillText(@msg, @x, @y)
                @context.restore()

    put: (msg, x=25, y=25, font='25px serif', style='black') ->
        context.font = font
        context.fillStyle = style
        context.fillText(msg, x, y)

    center: (msg, y=25, font='25px serif', style='black') ->
        context.font = font
        context.fillStyle = style
        dim = context.measureText(msg)
        x = (canvas.width - dim.width) / 2
        context.fillText(msg, x, y)

canvasApp = ->
    #
    # check for Canvas support
    #
    if Modernizr.canvas
        log("canvas is supported")
    else
        log("canvas is NOT supported")
        return

    #
    # get the canvas and its context
    #
    canvas = document.getElementById("canvasOne")
    context = canvas.getContext("2d")

    canvas.width = 0.98 * window.innerWidth
    canvas.height = 400

    #
    # make the label object
    #
    label = raw_label(context, canvas)

    #
    # set event handlers and other variables
    #
    exam = null
    start_button_click = ->
        if isNaN(dur_input.value) or dur_input.value == ""
            alert("Please enter duration in minutes.")
        else
            exam = makeExam(parseInt(dur_input.value, 10))
            bar.set_msg()
            start_button.style.visibility = "hidden"
            dur_span.style.visibility = "hidden"

            # start the animation loop
            setInterval(animationLoop, 1000 / frame_rate)

    start_button = document.getElementById("startbutton")
    start_button.onclick = start_button_click

    dur_input = document.getElementById("dur_in_min")
    dur_input.value = 180
    dur_span = document.getElementById("dur_span")

    window_resize = ->
        canvas.width = 0.98 * window.innerWidth
        bar.resize()
        # Apparently Chrome does not support window.resizeTo or window.resizeBy
    window.addEventListener("resize", window_resize, false)

    #
    # helper functions
    #
    background = (color) ->
        context.fillStyle = color
        context.fillRect(0, 0, canvas.width, canvas.height)

    background(yellow)

    #
    # large message text info
    #
    big_msg =
        msg: ""
        y: 175
        font: "90px serif"
        color: "blue"

    #
    # progress bar info
    #
    bar =
        x: 30
        y: 300
        width: canvas.width - 60
        height: 50
        resize: ->
            @width = canvas.width - 60
            @height = 50
            @set_msg()
        strokeStyle: "black"
        lineWidth: 1
        color: "red"
        set_msg: ->
            @start_msg = label.make({msg: "Start at #{exam.time.start.format()}", x: bar.x, y: bar.y - 10})
            @end_msg = label.make({msg: "End at #{exam.time.end.format()}", x: -1, y: bar.y - 10})
            @end_msg.x = @width - @end_msg.getWidthInPixels() + 25
        start_msg: "<start_msg>"
        end_msg: "<end_msg>"

    #
    # text scroll
    #
    scroll =
        x: 0
        y: 0
        dx: 0
        dy: 0
        last_change: (new Date).getTime()
        sit_time: 30 * 1000  # milliseconds
        hide_time: 5 * 1000
        state: "hiding"
        possible_states: [
            "finished"
            "descending"
            "ascending"
            "sitting"
            "hiding"
            ]
        draw: -> label.center(@msg, @y) unless @state == "hiding"
        update: ->
            now = (new Date).getTime()
            t = now - @last_change
            switch @state
                when "finished"
                    @dx = 0
                    @dy = 0
                    @y = 50
                    @msg = "Hand in your exam!"
                when "sitting"
                    @dx = 0
                    @dy = 0
                    if t > @sit_time
                        @state = "ascending"
                        @last_change = now
                when "hiding"
                    @dx = 0
                    @dy = 0
                    if t > @hide_time
                        @state = "descending"
                        @last_change = now
                        @msg = @messages.rand_choice()
                when "descending"
                    @dx = 0
                    @dy = 1
                    if @y >= 50
                        @y = 50
                        @state = "sitting"
                        @last_change = now
                when "ascending"
                    @dx = 0
                    @dy = -1
                    if @y <= 0
                        @y = 0
                        @state = "hiding"
                        @last_change = now

            @x += @dx
            @y += @dy

        msg: "<msg>"
        reset: ->
            @msg = @messages.rand_choice()
            @x = canvas.width + 10
            @y = 50
        messages: [
            "Put your name and SFU student ID # on each page."
            "Raise your hand if you have a question or need to use the washroom."
            "Read the questions carefully."
            "Double-check your answers if you have time."
            "Have mercy on your marker: write neatly!"
            "Pay attention to the details."
            "Relax. Stay calm. Chill."
            "Think!"
            ]


    animationLoop = ->
        background(yellow)
        #
        # set colors and messages based on time remaining
        #
        if exam.finished()
            bar.color = "green"
            big_msg.msg = "Exam is finished!"
            big_msg.color = "green"
            scroll.state = "finished"
        else if exam.remaining.minutes() <= 1
            bar.color = "red"
            big_msg.msg = exam.remaining.seconds() + " seconds left"
            big_msg.color = "red"
        else if exam.remaining.minutes() <= 10
            bar.color = "orange"
            big_msg.msg = exam.remaining.minutes() + " minutes left"
            big_msg.color = "orange"
        else
            bar.color = "blue"
            big_msg.msg = exam.remaining.minutes() + " minutes left"
            big_msg.color = "blue"

        #
        # draw the time remaining, current time, and start/end time labels
        #
        label.center(big_msg.msg, big_msg.y, big_msg.font, big_msg.color)
        label.center(currentTimeString(true), 210, "30px serif")
        bar.start_msg.render()
        bar.end_msg.render()

        #
        # progress bar
        #
        context.strokeStyle = bar.strokeStyle
        context.lineWidth = bar.lineWidth
        context.strokeRect(bar.x, bar.y, bar.width, bar.height)

        context.fillStyle = bar.color

        # w is the width of the progress bar
        millis_left = exam.remaining.millis()
        w = constrained_map(millis_left, exam.duration.millis, 0, 0, bar.width)
        context.fillRect(bar.x, bar.y, w, bar.height)

        # calculate and display the % completed
        pct = constrained_map(millis_left, exam.duration.millis, 0, 0, 100)
        pct_msg = Math.floor(pct) + "% done"
        pct_msg_width = context.measureText(pct_msg).width
        label.put(pct_msg, constrain(w, bar.x, canvas.width - (pct_msg_width + 3)), bar.y + 75)

        #
        # scroll bar
        #
        scroll.draw()
        scroll.update()


#
# The "load" event occurs when the HTML page finishes loading.
#
eventWindowLoaded = -> canvasApp()
window.addEventListener("load", eventWindowLoaded, false)

