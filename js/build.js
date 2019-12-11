Fliplet.Widget.instance('image-gallery', function (data) {
  var $container = $(this);

  function initGallery() {
    const WALL_SELECTOR = '[data-image-gallery-id=' + data.id + '] .wall:not("[data-mce-bogus] [data-image-gallery-id=' + data.id + '] .wall")';

    var wall = new Freewall(WALL_SELECTOR);

    wall.reset({
      selector: '.brick',
      animate: false,
      cellW: function() {
        var width = $('body').width();
        return width >= 640 ? 200 : 135;
      },
      cellH: 'auto',
      gutterX: 10,
      gutterY: 10,
      onResize: function() {
        wall.fitWidth();
        wall.refresh();
      },
      onComplete: function () {
        $container.addClass('freewall-ready');
      }
    });

    if (!Fliplet.Env.get('interact')) {
      $(WALL_SELECTOR + ' .brick img').click(function() {
        var $clickedBrick = $(this)[0].parentElement;

        data.options = data.options || {};
        data.options.index = $clickedBrick.index - 1;

        // Update remote image URLs to authenticated URLs
        Promise.all(_.map(_.get(data, 'images'), function (image, index) {
          if (!Fliplet.Media.isRemoteUrl(image.url)) {
            return Promise.resolve();
          }

          return Fliplet().then(function () {
            _.set(data, ['images', index, 'url'], Fliplet.Media.authenticate(image.url));
          });
        })).then(function () {
          Fliplet.Navigate.previewImages(data);
        });
      });
    }

    wall.fitWidth();

    $(WALL_SELECTOR + ' .brick img').on('load', function() {
      $(WALL_SELECTOR).trigger('resize');
    });

    return wall;
  }

  // Appearance change Hook
  Fliplet.Hooks.on('appearanceChanged', function () {
    initGallery();
  });

  initGallery();

  // Update remote image URLs to authenticated URLs
  $(this).find('.brick img').each(function () {
    var $img = $(this);
    var src = $img.attr('src');

    if (!Fliplet.Media.isRemoteUrl(src)) {
      return Promise.resolve();
    }

    return Fliplet().then(function () {
      var authSrc = Fliplet.Media.authenticate(src);

      if (src === authSrc) {
        return;
      }

      $img.attr('src', authSrc);
    });
  });
});
