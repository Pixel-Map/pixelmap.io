function decideBackground() {

    const hours = new Date().getHours();
    const isDayTime = hours < 7 && hours > 20;

    const day = "../images/bg4.jpg";
    const night = "../images/bg4 night.jpg";

    if (isDayTime) {
        $('html').css('background-image', "url('../images/bg4.jpg')");
    } else {
        $('html').css('background-image', "url('../images/bg4 night.jpg')");
    }
}