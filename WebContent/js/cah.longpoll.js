/**
 * AJAX long polling library.
 * 
 * @author ajanata
 */

cah.longpoll = {};
cah.longpoll.TIMEOUT = 2 * 60 * 1000;
// cah.longpoll.TIMEOUT = 5 * 1000;
cah.longpoll.INITIAL_BACKOFF = 500;
cah.longpoll.Backoff = cah.longpoll.INITIAL_BACKOFF;
cah.longpoll.Resume = true;
cah.longpoll.ErrorCodeHandlers = {};
cah.longpoll.EventHandlers = {};

cah.longpoll.longPoll = function() {
  cah.log.debug("starting long poll");
  $.ajax({
    complete : cah.longpoll.complete,
    error : cah.longpoll.error,
    success : cah.longpoll.done,
    timeout : cah.longpoll.TIMEOUT,
    url : '/cah/LongPollServlet',
  });
};

cah.longpoll.complete = function() {
  if (cah.longpoll.Resume) {
    setTimeout("cah.longpoll.longPoll()", cah.longpoll.Backoff);
  }
};

cah.longpoll.done = function(data) {
  cah.log.debug("long poll done", data);

  if (data['error']) {
    // TODO cancel any timers or whatever we may have, and disable interface
    // this probably should be done in the appropriate error code handler because we may not
    // want to always be that extreme.
    if (cah.longpoll.ErrorCodeHandlers[data.error_code]) {
      cah.longpoll.ErrorCodeHandlers[data.error_code](data);
    } else {
      cah.log.error(data.error_message);
    }
  } else {
    if (cah.longpoll.EventHandlers[data.event]) {
      cah.longpoll.EventHandlers[data.event](data);
    } else {
      cah.log.error("Unhandled event " + data.event);
    }
  }

  // reset the backoff to normal when there's a successful operation
  cah.longpoll.Backoff = cah.longpoll.INITIAL_BACKOFF;
};

cah.longpoll.error = function(jqXHR, textStatus, errorThrown) {
  // TODO deal with this somehow
  debugger;
  cah.log.debug(textStatus);
  cah.longpoll.Backoff *= 2;
  cah.log
      .error("Error communicating with server. Will try again in " + (cah.longpoll.Backoff / 1000)
          + " second" + (cah.longpoll.Backoff != 1000 ? "s" : "") + ".");
};
