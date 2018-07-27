/* global jQuery, XMLHttpRequest */
var page
let canScroll = true
let endSpeed = 500

// We use a "hash" value in the URL to track page numbers
let hashval = window.location.hash.substr(1)

if (hashval !== '' && !isNaN(hashval)) {
  page = parseInt(hashval, 10)
} else {
  page = 1
}

function findEdition (post) {
  const regex = /.*edition.*\n/i
  let edition
  let m

  if ((m = regex.exec(post)) !== null) {
    edition = m[0].replace('/sug/ Steven Universe General - ', '')

    if (edition.indexOf('[spoiler]') !== -1) {
      // Adding myself the closing <s>, in case someone fail'd
      edition = edition.replace('[spoiler]', '<s>').replace('[/spoiler]', '') + '</s>'
    }
  }

  return edition
}

function loadJson (callback = false) {
  if (page === 1) {
    window.location.hash = ''
    document.getElementById('lavalamp-previous').innerHTML = 'You\'re browsing /sug/ archives from Desuarchive'
  } else {
    // It looks like we can't go above that
    if (page > 40) page = 40

    window.location.hash = '#' + page
    document.getElementById('lavalamp-previous').innerHTML = 'Load previous'
  }

  const ul = document.getElementById('post-list')
  const request = new XMLHttpRequest()

  request.open('GET', 'https://desuarchive.org/_/api/chan/search/?board=co.trash&type=op&text=/sug/&page=' + page, true)
  request.onload = function () {
    if (this.status >= 200 && this.status < 400) {
      const data = JSON.parse(this.response)
      const posts = data['0']['posts']
      ul.innerHTML = ''

      for (var i = 0; i < posts.length; i++) {
        const post = posts[i]

        if ('media' in post) {
          const edition = findEdition(post['comment'])
          if (edition === undefined) continue

          const a = document.createElement('a')
          const li = document.createElement('li')
          const date = new Date(post['timestamp'] * 1000)
          let content

          a.setAttribute('href', 'https://desuarchive.org/' + post['board']['shortname'] + '/thread/' + post['thread_num'])

          content = '<div class="img"><img src="' + post['media']['thumb_link'] + '"></div>'
          content += '<div class="infos"><b>/' + post['board']['shortname'] + '/</b> N°' + post['thread_num']
          content += '<br> ' + date.toLocaleDateString() + ' at ' + date.toLocaleTimeString()
          content += '<br><i>' + edition + '</i></div>'

          li.innerHTML = content
          a.appendChild(li)
          ul.appendChild(a)
        }
      }

      if (callback) {
        callback()
      }
    } else {
      document.querySelector('#lavalamp span').innerHTML = 'Error code when loading API: ' + this.status
    }
  }

  request.onerror = function () {
    document.querySelector('#lavalamp span').innerHTML = 'Something went terribly wrong'
  }

  request.send()
}

(function (window, document, $) {
  'use strict'

  $.fn.lavalamp = function () {
    const self = this
    const $window = $(window)
    const $document = $(document)
    const $lavalamp = self.find('#lavalamp')
    const $previous = self.find('#lavalamp-previous')
    const $next = self.find('#lavalamp-next')

    self.animate = function (direction, scrollTarget) {
      const startClass = direction + '-start'
      const endClass = direction + '-end'

      canScroll = false
      $lavalamp.addClass(startClass)

      loadJson(function () {
        $window.scrollTop(scrollTarget)
        $lavalamp.removeClass(startClass).addClass(endClass)

        setTimeout(function () {
          canScroll = true
          $lavalamp.removeClass()
        }, endSpeed)
      })
    }

    $previous.click(function () {
      if (page !== 1) {
        page -= 1
        self.animate('down', $document.height())
      }
    })

    $next.click(function () {
      page += 1
      self.animate('up', 0)
    })

    $window.on('mousewheel', function (ev) {
      if (!canScroll) {
        ev.preventDefault()
      }
    })

    return self
  }

  loadJson(function () {
    const $lavalamp = $('#lavalamp')
    $lavalamp.removeClass('up-start').addClass('up-end')

    setTimeout(function () {
      $lavalamp.removeClass()
    }, endSpeed)
  })
})(window, document, jQuery)
