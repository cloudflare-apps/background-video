(function () {
  if (!document.addEventListener || !window.JSON) return

  var options = INSTALL_OPTIONS

  if (!options.url || !options.selector) {
    return
  }

  function addYouTubeCb (fn) {
    var existing

    existing = window.onYouTubeIframeAPIReady

    window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady () {
      if (existing) { existing() }

      fn()
    }
  }

  function _i (p, v) {
    return p + ': ' + v + ' !important;'
  }

  var aspectRatio = (function () {
    var aspectRatio = options.aspectRatio

    if (aspectRatio === 'custom') {
      aspectRatio = options.customAspectRatio
    }

    if (!aspectRatio || typeof aspectRatio !== 'string') {
      return
    }

    var split = aspectRatio.split(':')

    if (split.length !== 2) {
      return
    }

    return parseFloat(split[0], 10) / parseFloat(split[1], 10)
  })()

  if (!aspectRatio) return

  function parseURL (url) {
    var id

    var fullRe = /(?:https?:\/\/)?(?:www\.)?youtube.com\/(watch|playlist)\?(v|list)=([a-zA-Z0-9]+)/i
    var shortRe = /(?:https?:\/\/)?youtu.be\/([a-zA-Z0-9]+)(?:\?list=([a-zA-Z0-9]+))?/i

    var match = fullRe.exec(url)
    var type = 'watch'

    if (match) {
      type = match[1]
      id = match[3]
    } else {
      match = shortRe.exec(url)

      if (!match) { return null }

      if (match[2]) {
        type = 'playlist'
        id = match[2]
      } else {
        id = match[1]
      }
    }

    return {
      type: type,
      id: id
    }
  }

  function setStyles (location, iframe) {
    var locationHeight, locationWidth, locationAspectRatio, cssText, videoWidth, videoHeight

    location.setAttribute('data-cloudflare-background-video-app-css-position', window.getComputedStyle(location).position)

    locationHeight = location.clientHeight
    locationWidth = location.clientWidth
    locationAspectRatio = locationWidth / locationHeight

    cssText = ''
    if (locationAspectRatio > aspectRatio) {
      videoWidth = locationWidth
      videoHeight = videoWidth / aspectRatio

      cssText += _i('left', 0)
      cssText += _i('width', videoWidth + 'px')
      cssText += _i('top', ((-1 * (videoHeight / 2)) + (locationHeight / 2)) + 'px')
      cssText += _i('height', videoHeight + 'px')
    } else if (locationAspectRatio < aspectRatio) {
      videoHeight = locationHeight
      videoWidth = videoHeight * aspectRatio

      cssText += _i('top', 0)
      cssText += _i('height', videoHeight + 'px')
      cssText += _i('left', ((-1 * (videoWidth / 2)) + (locationWidth / 2)) + 'px')
      cssText += _i('width', videoWidth + 'px')
    } else {
      cssText += _i('top', 0)
      cssText += _i('left', 0)
      cssText += _i('width', '100%')
      cssText += _i('height', '100%')
    }

    iframe.style.cssText = cssText
  }

  function init () {
    var info, location, src, script, el, iframe

    info = parseURL(options.url)
    if (!info || info.type !== 'watch') {
      return
    }

    location = document.querySelector(options.selector)
    if (!location) {
      return
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

    el = document.createElement('cloudflare-background-video-app-element')
    el.innerHTML = '<iframe id="cloudflare-background-video-app-youtube-iframe" type="text/html" src="' + src + '" frameborder="0" allowTransparency="true" allowfullscreen></iframe>'
    iframe = el.querySelector('iframe')

    script = document.createElement('script')
    script.src = '//www.youtube.com/iframe_api'
    document.head.appendChild(script)

    addYouTubeCb(function () {
      var player = new window.YT.Player('cloudflare-background-video-app-youtube-iframe', {
        events: {
          onReady: function () {
            location.setAttribute('data-cloudflare-background-video-state', 'loading')

            player.mute()
            player.playVideo()

            function onPlayerStateChange (e) {
              if (e.data === 1) {
                location.setAttribute('data-cloudflare-background-video-state', 'playing')
              } else if (e.data === 3) {
                location.setAttribute('data-cloudflare-background-video-state', 'buffering')
              } else {
                location.setAttribute('data-cloudflare-background-video-state', 'loading')
              }
            }

            var playerState = player.getPlayerState()
            onPlayerStateChange({ data: playerState })

            player.addEventListener('onStateChange', onPlayerStateChange)

            setInterval(function () {
              var state = player.getPlayerState()
              if (playerState !== state) {
                onPlayerStateChange({
                  data: state
                })
                playerState = state
              }
            }, 10)
          }
        }
      })
    })

    location.setAttribute('data-cloudflare-background-video-app-location', '')
    setStyles(location, iframe)
    location.appendChild(el)

    window.addEventListener('resize', function () {
      setStyles(location, iframe)
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
