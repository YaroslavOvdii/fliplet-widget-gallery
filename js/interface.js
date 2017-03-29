var widgetId = Fliplet.Widget.getDefaultId();
var data = Fliplet.Widget.getData() || {};
data.images = data.images || [];
console.log(data.images);


var $addImageButton = $('#add-image');
var $imagesContainer = $('.image-library');
var $editImageTitle = $('.edit-title-section');
var $editInput = $('#edit-input');
var $editClose = $('#editClose');
var $editButton = $('#edit-button');

var selectedImage;

var $PROVIDER_IFRAME;
var providerInstance;
var imageForEditIndex;
var imageTemplate = Fliplet.Widget.Templates['templates.image'];

const FILE_PICKER_CONFIG = {
  selectFiles: [],
  selectMultiple: true,
  type: 'image',
  fileExtension: ['JPG', 'JPEG', 'PNG', 'GIF', 'TIFF'],
  autoSelectOnUpload: true
};


$imagesContainer
  .on('click', '.image', onImageClick);

$editClose
  .on('click', onEditClose);

$editButton
  .on('click', onEditClick);

$editInput
  .on('input', onInputChange);

$('body')
  .keydown(editImageTitleBinding);

function editImageTitleBinding(e) {
  if($editImageTitle.is(':visible'))
    var code = e.keyCode || e.which;
  switch(code){
    case 27:
      onEditClose(e);
      break;
    case 9:
      onEditClose(e);
      e.shiftKey ? selectPrevImage(e) : selectNextImage(e);

      changeDragging(false);
      $editInput.val(selectedImage.title || '');
      $('div[data-file-id=' + selectedImage.id + ']').append($editImageTitle.detach());
      $editImageTitle.show();

      $editInput.focus();
      break;
    default:
      break;
  }
}

function getCurrentItemIndex(){
  return data.images.findIndex(function (image, index) {
    if (image.id === selectedImage.id) {
      return true;
    }
  });
}


function selectPrevImage(e) {
  e.preventDefault();
  var currentItemIndex = getCurrentItemIndex();
  if (currentItemIndex > 0) {
    selectedImage = data.images[currentItemIndex - 1];
  }
}

function selectNextImage(e) {
  e.preventDefault();
  var currentItemIndex = getCurrentItemIndex();
  if (currentItemIndex + 1 < data.images.length ) {
    selectedImage = data.images[currentItemIndex + 1];
  }
}

function changeWidgetHeader() {
  var headerText = data.images.length ?
    'Continue building your gallery by adding new images' :
    'Set up a gallery by adding new images';
  $('.help-text').text(headerText);
}


function init(){
  drawImages();
}

$addImageButton.on('click', function (e) {
  e.preventDefault();
  if (providerInstance) return;
  onEditClose(e);
  Fliplet.Widget.toggleSaveButton(false);
  Fliplet.Widget.toggleCancelButton(false);
  Fliplet.Studio.emit('widget-save-label-update', {text: 'Select'});

  providerInstance = Fliplet.Widget.open('com.fliplet.file-picker', {
    data: FILE_PICKER_CONFIG,
    onEvent: function (e, data) {
      switch (e) {
        case 'widget-rendered':
          beginAnimationFilePicker();
          break;
        case 'widget-set-info':
          Fliplet.Widget.toggleSaveButton(!!data.length);
          var msg = data.length ? data.length + ' files selected' : 'no selected files';
          Fliplet.Widget.info(msg);
          break;
        default:
          break;
      }
    }
  });

  providerInstance.then(function (data) {
    Fliplet.Studio.emit('widget-save-label-update', {text: 'Save & Close'});
    Fliplet.Widget.info('');
    Fliplet.Widget.toggleCancelButton(true);
    Fliplet.Widget.toggleSaveButton(true);
    this.data.images = this.data.images.concat(data.data);
    $DARKZONE.css({opacity: 0});
    providerInstance = null;
    drawImages();
    savePreview();
  });
});

function savePreview(){
  Fliplet.Widget.save(data).then(function () {
    Fliplet.Studio.emit('reload-widget-instance', widgetId);
  });
}

function drawImages() {
  changeWidgetHeader();
  $imagesContainer.empty();
  data.images.forEach(addImage);
}

function changeDragging(status) {
  $imagesContainer.sortable('option', 'disabled', !status);
}

$imagesContainer.sortable({
  disabled: false,
  containment: "parent",
  tolerance: "pointer"
});

$imagesContainer.on('sortstop', function(event, ui) {
  var oldIndex = getSelectedImage(ui.item).index;
  var newIndex = $('.image').index(ui.item[0]);
  var image = Object.assign(data.images[oldIndex]);
  data.images.splice(oldIndex, 1);
  data.images.splice(newIndex, 0, image);
  savePreview();
});

var $draggingElement;

function addImage(image){
  image.urlSmall = Fliplet.Env.get('apiUrl') + 'v1/media/files/' + image.id + '/contents?size=small';
  var $imgElement = $(imageTemplate(image));

  $imgElement[0].onmouseover = function() {
    $deleteBtn = $(this).find('.image-overlay i');
    $deleteBtn[0].onclick = function() {
      onEditClose();
      data.images.splice(getSelectedImage($imgElement).index, 1);
      $imgElement.remove();
      changeWidgetHeader();
      savePreview();
    };
  };

  $imagesContainer.append($imgElement);
}

function beginAnimationFilePicker() {
  var animProgress = 100;
  var animInterval;
  $DARKZONE = $('.darkzone');
  $PROVIDER_IFRAME = $('iframe');

  $PROVIDER_IFRAME.show();

  animInterval = setInterval(function () {
    animProgress -= 2;
    $PROVIDER_IFRAME.css({left: animProgress + '%'});
    var opacity = 1 - animProgress/100;
    opacity = opacity > 0.5 ? 0.5 : opacity;
    if (animProgress == 0) {
      opacity = 0;
      clearInterval(animInterval);
    }
    $DARKZONE.css({opacity: opacity});
  }, 5);
}

Fliplet.Widget.onSaveRequest(function () {
  if (providerInstance) {
    return providerInstance.forwardSaveRequest();
  }

  Fliplet.Widget.save(data).then(function () {
    Fliplet.Widget.complete();
  });
});

window.addEventListener('message', function (event) {
  if (event.data === 'cancel-button-pressed') {
    if (!providerInstance) return;
    providerInstance.close();
    providerInstance = null;
    Fliplet.Studio.emit('widget-save-label-update', {text: 'Save & Close'});
    Fliplet.Widget.toggleCancelButton(true);
    Fliplet.Widget.toggleSaveButton(true);
    Fliplet.Widget.info('');
  }
});


function getSelectedImage($img) {
  var selectedImage = data.images.find(function(item) {
    return $img.data('file-id') === item.id;
  });
  return {
    index: data.images.indexOf(selectedImage),
    img: selectedImage
  };
}

function onImageClick(e){
  e.preventDefault();
  var $el = $(this);
  var selectedImageObj = getSelectedImage($el);
  if(selectedImageObj.index === imageForEditIndex) return;
  selectedImage = selectedImageObj.img;
  imageForEditIndex = selectedImageObj.index;
  $editInput.val(selectedImage.title || '');
  $el.append($editImageTitle.detach());
  changeDragging(false);
  $editImageTitle.show();
  $editInput.focus();
}

$editInput.keyup(function( event ) {
  if ( event.which == 13 ) {
    event.preventDefault();
    changeImageTitle();
    onEditClose(event);
  }
});

function onInputChange(e){
  changeImageTitle();
}

function changeImageTitle(){
  if (!selectedImage) return;
  selectedImage.title = $editInput.val() ? $editInput.val() : '';
  $el = $('div[data-file-id=' + selectedImage.id + ']').find('.title-text');
  selectedImage.title ?
    $el.removeClass('title-default-text').text(selectedImage.title) :
    $el.text('').addClass('title-default-text');
}

function onEditClose(e) {
  if(e) e.preventDefault();
  imageForEditIndex = null;
  $editImageTitle.detach();
  changeDragging(true);
}

function onEditClick() {
  event.preventDefault();
  var imageIndex = imageForEditIndex;
  onEditClose();
  Fliplet.Widget.toggleSaveButton(false);
  Fliplet.Widget.toggleCancelButton(false);
  Fliplet.Studio.emit('widget-save-label-update', {text: 'Save changes'});
  providerInstance = Fliplet.Widget.open('com.fliplet.image-editor', {
    data: {image: selectedImage},
    onEvent: function (e, data) {
      switch (e) {
        case 'widget-rendered':
          beginAnimationFilePicker();
          break;
        case 'widget-set-info':
          Fliplet.Widget.toggleSaveButton(true);
          break;
        default:
          break;
      }
    }
  });

  providerInstance.then(function (eventData) {
    eventData.data.image.title = data.images[imageIndex].title;
    data.images[imageIndex] = eventData.data.image;
    onEditClose();
    Fliplet.Studio.emit('widget-save-label-update', {text: 'Save & Close'});
    Fliplet.Widget.info('');
    Fliplet.Widget.toggleCancelButton(true);
    Fliplet.Widget.toggleSaveButton(true);
    $DARKZONE.css({opacity: 0});
    providerInstance = null;
    drawImages();
    savePreview();
  });

}

init();


//use window.postMessage("save-widget", "*"); to click "Save and click"
