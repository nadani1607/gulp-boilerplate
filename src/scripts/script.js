/**
 * Fixed header animation
 */
$(window).scroll(function () {
  const sticky = $('.header');
  const scroll = $(window).scrollTop();

  if (scroll >= 1) {
    sticky.addClass('fixed');
  } else {
    sticky.removeClass('fixed');
  }
});

/*
 * Mobile burger
 */
$(document.body).on('click', '.header__burger', toggleMenu);

/**
 * Toggle mobile menu
 */
function toggleMenu() {
  $('.header__svg').toggleClass('opened');
  $('.header__menu').toggleClass('opened');
}

/**
 * Close menu on click link
 */
$(document.body).on('click', '.header__item', function () {
  $('.header__menu').addClass('hidden');
});

/**
 * Smooth scroll
 */
$('a[href*="#"]').on('click', function (e) {
  e.preventDefault();

  if (window.innerWidth <= 991.98) {
    toggleMenu();
  }

  $('html, body').animate(
    {
      scrollTop: $($(this).attr('href')).offset().top,
    }, 500, 'linear');
});
