/**
 * @author Tarek Auel
 * @since Sep 15, 2014
 */
module.exports = function (docent) {
    var modifyDate = new Date(docent.bearbeitet),
        creationDate = new Date(docent.angelegt);

    var newDocent = {};

    if (docent.idDozent !== '')                   newDocent.id = docent.idDozent;
    if (docent.name !== '')                       newDocent.lastName = docent.name;
    if (docent.vorname !== '')                    newDocent.firstName = docent.vorname;
    if (docent.titel !== '')                      newDocent.title = docent.titel;
    if (docent.email !== '')                      newDocent.email = docent.email;
    if (docent.telefonPrivat !== '')              newDocent.phonePrivate = docent.telefonPrivat;
    if (docent.telefonGeschaeftlich !== '')       newDocent.phoneBusiness = docent.telefonGeschaeftlich;
    if (docent.fax !== '')                        newDocent.fax = docent.fax;
    if (docent.arbeitgeber !== '')                newDocent.employer = docent.arbeitgeber;
    if (docent.geschlecht !== '')                 newDocent.sex = docent.geschlecht;
    if (docent.strasse !== '')                    newDocent.street = docent.strasse;
    if (docent.plz !== '' && docent.plz !== '0')  newDocent.zipCode = docent.plz;
    if (docent.wohnort !== '')                    newDocent.city = docent.wohnort;

    newDocent.created = creationDate.getTime();
    newDocent.lastModifed = modifyDate.getTime();

    return newDocent;
};