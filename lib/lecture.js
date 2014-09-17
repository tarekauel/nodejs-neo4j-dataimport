/**
 * @author Tarek Auel
 * @since Sep 15, 2014
 */
module.exports = function (lecture) {
    var newLecture = {};

    newLecture.id = lecture.idFach;
    if (lecture.name) newLecture.title = lecture.name;
    if (lecture.kurzbezeichnung) newLecture.shortTitle = lecture.kurzbezeichnung;

    return newLecture;
};