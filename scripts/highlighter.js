$(function() {
  $.fn.maphilight.defaults = {
  fill: true,
  fillColor: '008000',
  fillOpacity: 0.2,
  stroke: true,
  strokeColor: '008000',
  strokeOpacity: 1,
  strokeWidth: 2,
  fade: true,
  alwaysOn: false,
  neverOn: false,
  groupBy: false,
  wrapClass: true,
  shadow: false,
  shadowX: 0,
  shadowY: 0,
  shadowRadius: 6,
  shadowColor: '000000',
  shadowOpacity: 0.8,
  shadowPosition: 'outside',
  shadowFrom: false
  }
  $('.map').maphilight();
});
