Fliplet.Widget.instance('image-gallery', function (data) {

  const photoswipeTemplate = Fliplet.Widget.Templates['templates.photoswipe'];

  function initGallery() {
    const WALL_SELECTOR = '[data-image-gallery-id=' + data.id + '] .wall';

    var wall = new Freewall(WALL_SELECTOR);

    wall.reset({
      selector: '.brick',
      animate: true,
      cellW: function() {
        var width = $('body').width();
        return width >= 640 ? 300 : 135;
      },
      cellH: 'auto',
      gutterX: 10,
      gutterY: 10,
      onResize: function() {
        wall.fitWidth();
        wall.refresh();
      }
    });

    if(!Fliplet.Env.get('interact')) {
      $(WALL_SELECTOR + ' .brick img').click(function () {
        var $clickedBrick = $(this)[0].parentElement;
        var gallery = openPhotoSwipe($clickedBrick.index - 1);
      });

      function openPhotoSwipe(index) {
        var items = $(WALL_SELECTOR).find('.brick img');

        items = items.map(function(i, img) {
          return {
            src: img.src,
            title: img.alt,
            w: img.naturalWidth,
            h: img.naturalHeight
          };
        });

        var options = {
          history: false,
          focus: false,
          closeOnScroll: false,
          shareEl: false,
          fullscreenEl: false,
          zoomEl: false,
          index: index,

          showAnimationDuration: 0,
          hideAnimationDuration: 0
        };
        $('body').append($.parseHTML(photoswipeTemplate()));
        var gallery = new PhotoSwipe(document.querySelectorAll('.pswp')[0], PhotoSwipeUI_Default, items, options);
        gallery.init();

      }
    }

    wall.fitWidth();


    $(WALL_SELECTOR + ' .brick img').on('load', function() {
        $(WALL_SELECTOR).trigger('resize');
    });

    return wall;
  }

  initGallery();
});

