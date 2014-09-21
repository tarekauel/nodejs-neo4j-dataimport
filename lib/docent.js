/**
 * @author Tarek Auel
 */

/**
 * Creates a mapping object for docents
 * @param {object} docent a json object from the old database
 * @return {object} a docent object for the new data model
 */
module.exports = function(docent) {
    var modifyDate = new Date(docent.bearbeitet),
        creationDate = new Date(docent.angelegt),
        properties = 0;

    var newDocent = {};

    if (docent.idDozent !== '') {
        ++properties;
        newDocent.id = docent.idDozent;
    }
    if (docent.name !== '') {
        ++properties;
        newDocent.lastName = docent.name;
    }
    if (docent.vorname !== '') {
        ++properties;
        newDocent.firstName = docent.vorname;
    }
    if (docent.titel !== '') {
        ++properties;
        newDocent.title = docent.titel;
    }
    if (docent.mail !== '') {
        ++properties;
        newDocent.email = docent.mail;
    }
    if (docent.telefonPrivat !== '') {
        ++properties;
        newDocent.phonePrivate = docent.telefonPrivat;
    }
    if (docent.telefonGeschaeftlich !== '') {
        ++properties;
        newDocent.phoneBusiness = docent.telefonGeschaeftlich;
    }
    if (docent.fax !== '') {
        ++properties;
        newDocent.fax = docent.fax;
    }
    if (docent.arbeitgeber !== '') {
        ++properties;
        newDocent.employer = docent.arbeitgeber;
    }
    if (docent.geschlecht !== '') {
        ++properties;
        newDocent.sex = docent.geschlecht;
    }
    if (docent.strasse !== '') {
        ++properties;
        newDocent.street = docent.strasse;
    }
    if (docent.plz !== '' && docent.plz !== '0') {
        ++properties;
        newDocent.zipCode = docent.plz;
    }
    if (docent.wohnort !== '') {
        ++properties;
        newDocent.city = docent.wohnort;
    }

    newDocent.created = creationDate.getTime();
    ++properties;
    newDocent.lastModifed = modifyDate.getTime();
    ++properties;

    return {
        cypher:
            'MATCH (s:Status {id:' + docent.idStatus + '}) ' +
            'CREATE (d:Docent {props} ), d-[:hasStatus]->(s) RETURN d;',
        parameter: {
            props: newDocent
        },
        expectedStats: {
            nodes_created: 1,
            labels_added: 1,
            properties_set: properties,
            relationships_created: 1,
            contains_updates: true
        }
    };
};
