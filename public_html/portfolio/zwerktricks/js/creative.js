(function($) {
    "use strict"; // Start of use strict

    // transparand verwijderen
    var transparant = function() {
        if ($("#mainNav").offset().top > 437) {
            $("#mainNav").addClass("navbar-shrink");
        } else {
            $("#mainNav").removeClass("navbar-shrink");
        }
    };
    // Collapse now if page is not at top
    transparant();
    // Collapse the navbar when page is scrolled
    $(window).scroll(transparant);



})(jQuery); // End of use strict

//sterren




(function ($) {

    // $('.sterren i').hover(function () { //start
    //
    //     $(this).siblings().addBack().removeClass('fas').addClass('far'); //verwijder ale
    //     $(this).prevAll().addBack().toggleClass('fas far');
    // });
    var teller = 2;
    $('.sterren i.fa-star').click(function () {
        teller++;

        $(this).siblings().addBack().removeClass('fas').addClass('far'); //verwijder ale
        $(this).prevAll().addBack().toggleClass('fas far');
        // console.warn("teller staat op "+teller);
        return(teller);
    });


        $('.sterren i.fa-star').hover(function () { //start
            if (teller%2 === 0) {
                $(this).siblings().addBack().removeClass('fas').addClass('far'); //verwijder ale
                $(this).prevAll().addBack().toggleClass('fas far');
            }
        });


})(jQuery);


//Scrollanimatie - Esteban Beernes
jQuery(document).ready(function($){

    $('a.scroll-link').click(function(e){
        e.preventDefault();
        $id = $(this).attr('href');
        $('body,html').animate({
            scrollTop: $($id).offset().top -90
        }, 750);
    });
});

//Scrollanimatie verwijderen na scroll - Esteban Beerens
$(window).scroll(function() {
    var scroll = $(window).scrollTop();

    if (scroll >= 100) {
        $('.parallax a').addClass('remove');
    } else {
        $('.parallax a').removeClass('remove');
    }
});

function updateMenuButton() {
    $('.js-menu-button').find('.menu-icon').toggleClass('is-active');
}

$(document).ready(function() {

    $('.js-menu-button').click(function(e){

        e.preventDefault();
        updateMenuButton();

    });

});


(function ($) {
    var getal = 50;
    var verplaatsing = "translateX("+getal+"px)";

    $('div .bewegen').hover(function () {
        $('div .bewegen').css({transform: verplaatsing});
        // console.warn("verplaatsing is "+verplaatsing);
        $('div .stop').click(function () {
            $('div img.opmaak').toggleClass('bewegen');
        })
    },function () {

        getal = getal+50;

        if (getal<=800)
            getal = getal+50;
        else
            getal=20;
        verplaatsing= "translateX("+getal+"px)";
        // console.warn("getal is "+getal);
        // console.warn("verplaatsing na getal "+verplaatsing);
        //return verplaatsing,getal;

    })
    $(' div i.fas').click(function () {
        $('div i.pijl').toggleClass('fa-pause fa-play');
        $('div .opmaak').toggleClass('bewegen');
    })
})(jQuery);