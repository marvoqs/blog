const dateFormat = require('dateformat');

dateFormat.i18n = {
  dayNames: ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so', 'neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'],
  monthNames: [
    'ledna',
    'února',
    'března',
    'dubna',
    'května',
    'června',
    'července',
    'srpna',
    'září',
    'října',
    'listopadu',
    'prosince',
    'ledna',
    'února',
    'března',
    'dubna',
    'května',
    'června',
    'července',
    'srpna',
    'září',
    'října',
    'listopadu',
    'prosince',
  ],
  timeNames: ['a', 'p', 'am', 'pm', 'A', 'P', 'AM', 'PM'],
};

module.exports = dateFormat;
