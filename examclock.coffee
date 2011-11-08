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
log = (msg) -> if console? then console.log(msg)

format = (date, include_seconds=false) ->
    hours = date.getHours()      # 0-23
    minutes = date.getMinutes()  # 0-59
    seconds = date.getSeconds()  # 0-59

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

currentTimeString = (include_seconds=false)-> format(new Date, include_seconds)


millis_to_secs = (m) -> m / 1000
millis_to_mins = (m) -> (m / 1000) / 60

secs_to_millis = (s) -> 1000 * s
mins_to_millis = (m) -> 60 * m * 1000

makeExam = (dur_in_min) ->
    now = new Date()
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
    # global variables
    #
    frame_rate = 30
    yellow = "#ffffaa"

    #
    # get the canvas and its context
    #
    canvas = document.getElementById("canvasOne")
    context = canvas.getContext("2d")

    exam = null
    running = false
    start_button_click = ->
        log("start button clicked!")
        if isNaN(dur_input.value) or dur_input.value == ""
            alert("Please enter duration in minutes.")
        else
            running = true
            exam = makeExam(parseInt(dur_input.value))
            start_button.style.visibility = "hidden"
            dur_span.style.visibility = "hidden"


    start_button = document.getElementById("startbutton")
    start_button.onclick = start_button_click
    dur_input = document.getElementById("dur_in_min")
    dur_input.value = 180
    dur_span = document.getElementById("dur_span")

    #
    # helper functions
    #
    background = (color) ->
        context.fillStyle = color
        context.fillRect(0, 0, canvas.width, canvas.height)

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

    # putLabel is a simple way to put text on the screen
    # with minimum effort
    putLabel = (msg, x=25, y=25, font='25px serif', style='black') ->
        context.font = font
        context.fillStyle = style
        context.fillText(msg, x, y)

    centerLabel = (msg, y=25, font='25px serif', style='black') ->
        context.font = font
        context.fillStyle = style
        dim = context.measureText(msg)
        x = (canvas.width - dim.width) / 2
        context.fillText(msg, x, y)

    setup = ->
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
        strokeStyle: "black"
        lineWidth: 1
        color: "red"


    animationLoop = ->
        background(yellow)

        if not running then return

        #
        # start and end time
        #
        #putLabel("  Start at " + format(exam.time.start), 1, 50, "30px serif")
        #putLabel("     End at " + format(exam.time.end), canvas.width - 300, 50, "30px serif")

        #
        # time remaining and current time
        #
        if exam.finished()
            bar.color = "green"
            big_msg.msg = "Exam is finished!"
            big_msg.color = "green"
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

        centerLabel(big_msg.msg, big_msg.y, big_msg.font, big_msg.color)
        centerLabel(currentTimeString(true), 210, "30px serif")
        centerLabel("Start at #{format(exam.time.start)}                                            End at #{format(exam.time.end)}", 290, "30px serif")

        #
        # progress bar
        #
        context.strokeStyle = bar.strokeStyle
        context.lineWidth = bar.lineWidth
        context.strokeRect(bar.x, bar.y, bar.width, bar.height)

        context.fillStyle = bar.color

        # w is the width of the progress bar
        erm = exam.remaining.millis()
        w = constrained_map(erm, exam.duration.millis, 0, 0, bar.width)
        context.fillRect(bar.x, bar.y, w, bar.height)

        # calculate and display the % completed
        pct = constrained_map(erm, exam.duration.millis, 0, 0, 100)
        pct_msg = Math.floor(pct) + "% done"
        pct_msg_width = context.measureText(pct_msg).width
        putLabel(pct_msg, constrain(w, bar.x, canvas.width - (pct_msg_width + 3)), bar.y + 75)


    #
    # call animationLoop once every (1000 / frame_rate) milliseconds
    #
    setup()
    setInterval(animationLoop, 1000 / frame_rate)


#
# The "load" event occurs when the HTML page finishes loading.
#
eventWindowLoaded = -> canvasApp()
window.addEventListener("load", eventWindowLoaded, false)

