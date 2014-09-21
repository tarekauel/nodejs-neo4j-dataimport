/**
 * @author Tarek Auel
 */
/**
 * Creates a mapping event object for the new data model
 * @param {object} event a json object of the old data model
 * @return {object} a event object of the new data model
 */

module.exports = function(event) {
    var newEvent = {},
        cypherStatement,
        relationships = 0;
        properties = 0;

    newEvent.id = event.idEvent;
    ++properties;

    newEvent.startTime = (event.startTime * 1000);
    ++properties;

    newEvent.endTime = (event.endTime * 1000);
    ++properties;

     if (event.klausur) {
         ++properties;
         newEvent.exam = true;
     }

    cypherStatement =
        'MATCH ';

    if (event.raum && event.raum !== '') {
        cypherStatement +=
            '(r:Room {name:\'' + event.raum + '\'}), ';
    }

    cypherStatement +=
        '(ls:LectureSeries {id:' + event.idVorlesung + '}) ' +
        'CREATE (e:Event {props}), ';

    if (event.raum && event.raum !== '') {
        cypherStatement +=
            '(e)-[:uses]->(r), ';
        ++relationships;
    }

    cypherStatement +=
        '(e)-[:isEventOf]->(ls);';
    ++relationships;

    return {
        cypher: cypherStatement,
        parameter: {
            props: newEvent
        },
        expectedStats: {
            properties_set: properties,
            nodes_created: 1,
            relationships_created: relationships,
            contains_updates: true,
            labels_added: 1
        }
    };
};
