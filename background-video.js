(function(){
  if (!document.addEventListener || !window.JSON) return;

  var options, _i, aspectRatio, parseURL, setStyles, init, addYouTubeCb;

  options = INSTALL_OPTIONS;

  if (!options.url || !options.selector) {
    return;
  }

  addYouTubeCb = function(fn) {
    var existing;

    existing = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = function(){
      if (existing)
        existing();

      fn();
    }
  }

  _i = function(p, v) {
    return p + ': ' + v + ' !important;';
  };

  aspectRatio = (function(){
    var aspectRatio, split;

    aspectRatio = options.aspectRatio;

    if (aspectRatio === 'custom') {
      aspectRatio = options.customAspectRatio;
    }

    if (!aspectRatio || typeof aspectRatio !== 'string') {
      return;
    }

    split = aspectRatio.split(':')

    if (split.length !== 2) {
      return;
    }

    return parseFloat(split[0], 10) / parseFloat(split[1], 10);
  })();

  if (!aspectRatio) {
    return;
  }

  parseURL = function(url) {
    var fullRe, shortRe, match, type, id;

    fullRe = /(?:https?:\/\/)?(?:www\.)?youtube.com\/(watch|playlist)\?(v|list)=([a-zA-Z0-9]+)/i;
    shortRe = /(?:https?:\/\/)?youtu.be\/([a-zA-Z0-9]+)(?:\?list=([a-zA-Z0-9]+))?/i;

    match = fullRe.exec(url);
    type = 'watch';

    if (match) {
      type = match[1];
      id = match[3];
    } else {
      match = shortRe.exec(url);

      if (!match)
        return null;

      if (match[2]) {
        type = 'playlist';
        id = match[2];
      } else {
        id = match[1];
      }
    }

    return {
      type: type,
      id: id
    };
  };

  setStyles = function(location, iframe) {
    var locationHeight, locationWidth, locationAspectRatio, cssText, videoWidth, videoHeight;

    location.setAttribute('data-eager-background-video-app-css-position', getComputedStyle(location).position);

    locationHeight = location.clientHeight;
    locationWidth = location.clientWidth;
    locationAspectRatio = locationWidth / locationHeight;

    cssText = '';
    if (locationAspectRatio > aspectRatio) {
      videoWidth = locationWidth;
      videoHeight = videoWidth / aspectRatio;

      cssText += _i('left', 0);
      cssText += _i('width', videoWidth + 'px');
      cssText += _i('top', ((- 1 * (videoHeight / 2)) + (locationHeight / 2)) + 'px');
      cssText += _i('height', videoHeight + 'px');

    } else if (locationAspectRatio < aspectRatio) {
      videoHeight = locationHeight;
      videoWidth = videoHeight * aspectRatio;

      cssText += _i('top', 0);
      cssText += _i('height', videoHeight + 'px');
      cssText += _i('left', ((- 1 * (videoWidth / 2)) + (locationWidth / 2)) + 'px');
      cssText += _i('width', videoWidth + 'px');

    } else {
      cssText += _i('top', 0);
      cssText += _i('left', 0);
      cssText += _i('width', '100%');
      cssText += _i('height', '100%');
    }

    iframe.style.cssText = cssText;
  };

  init = function() {
    var info, location, src, script, el, iframe;

    info = parseURL(options.url);
    if (!info || info.type !== 'watch') {
      return;
    }

    location = document.querySelector(options.selector);
    if (!location) {
      return;
    }

    src = '//www.youtube.com/embed/' + info.id +
      '?rel=0' +
      '&enablejsapi=1' +
      '&autoplay=1' +
      '&controls=0' +
      '&showinfo=0' +
      '&loop=1' +
      '&playlist=' + info.id +
      '&iv_load_policy=3'
    ;

    el = document.createElement('eager-background-video-app-element');
    el.innerHTML = '<iframe id="eager-background-video-app-youtube-iframe" type="text/html" src="' + src +'" frameborder="0" allowTransparency="true" allowfullscreen></iframe>';
    iframe = el.querySelector('iframe');

    script = document.createElement('script');
    script.src = "//www.youtube.com/iframe_api";
    document.head.appendChild(script);

    addYouTubeCb(function() {
      var player = new YT.Player('eager-background-video-app-youtube-iframe', {
        events: {
          onReady: function() {
            var playerState, onPlayerStateChange, stateInterval;

            location.setAttribute('data-eager-background-video-state', 'loading');

            player.mute();
            player.playVideo();

            onPlayerStateChange = function(e) {
              if (e.data === 1) {
                location.setAttribute('data-eager-background-video-state', 'playing');
              } else if (e.data === 3) {
                location.setAttribute('data-eager-background-video-state', 'buffering');
              } else {
                location.setAttribute('data-eager-background-video-state', 'loading');
              }
            };

            playerState = player.getPlayerState();
            onPlayerStateChange({ data: playerState });

            player.addEventListener('onStateChange', onPlayerStateChange);
            stateInterval = setInterval(function(){
              var state = player.getPlayerState();
              if (playerState !== state) {
                onPlayerStateChange({
                  data: state
                });
                playerState = state;
              }
            }, 10);
          }
        }
      });
    });

    location.setAttribute('data-eager-background-video-app-location', '');
    setStyles(location, iframe);
    location.appendChild(el);

    window.addEventListener('resize', function(){
      setStyles(location, iframe);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
