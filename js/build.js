Fliplet.Widget.instance('image-gallery', function(data) {
  var photoswipeTemplate = Fliplet.Widget.Templates['templates.photoswipe'];
  var wallSelector = '[data-image-gallery-id=' + data.id + '] .wall:not("[data-mce-bogus] [data-image-gallery-id=' + data.id + '] .wall")';

  function initGallery() {
    var wall = new Freewall(wallSelector);

    // Authenticate encrypted media files
    if (Fliplet.Env.is('native')) {
      $(wallSelector).find('.brick img').each(function () {
        var $img = $(this);
        var url = $img.attr('src');

        if (url.indexOf('auth_token') === -1) {
          var authenticated = Fliplet.Media.authenticate(url);

          if (url !== authenticated) {
            $img.attr('src', authenticated);
          }
        }
      });
    }

    wall.reset({
      selector: '.brick',
      animate: true,
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
      }
    });

    if (!Fliplet.Env.get('interact')) {
      $(wallSelector + ' .brick img').click(function() {
        var $clickedBrick = $(this)[0].parentElement;

        data.options = data.options || {}
        data.options.index = $clickedBrick.index - 1

        var gallery = Fliplet.Navigate.previewImages(data);

        gallery.listen('afterChange', function(context) {
          Fliplet.Page.Context.update({
            galleryId: data.id,
            galleryOpenIndex: this.getCurrentIndex()
          });
        });

        gallery.listen('close', function() {
          Fliplet.Page.Context.remove(['galleryId', 'galleryOpenIndex']);
        });
      });
    }

    wall.fitWidth();
    parseQueries();

    $(wallSelector + ' .brick img').on('load', function() {
      $(wallSelector).trigger('resize');
    });

    return wall;
  }

  function parseQueries() {
    var query = Fliplet.Navigate.query;

    if (!query.galleryOpenIndex) {
      return;
    }

    if (query.galleryId && query.galleryId != data.id) {
      return;
    }

    if (query.galleryId) {
      $(wallSelector + ' .brick:eq(' + query.galleryOpenIndex + ') img').click();
      return;
    }

    $('[data-image-gallery-id] .wall:not("[data-mce-bogus] [data-image-gallery-id] .wall") .brick:eq(' + query.galleryOpenIndex + ') img').click();
  }

  // Appearance change Hook
  Fliplet.Hooks.on('appearanceChanged', function () {
    initGallery();
  });

  Fliplet().then(function () {
    initGallery();
  });
});
