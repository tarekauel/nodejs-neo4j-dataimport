/**
 * @author Tarek Auel
 */
/**
 * Creates a mapping course object for the new data model
 * @param {object} course a json object of the old data model
 * @return {course} a course object of the new data model
 */
module.exports = function(course) {
    var courseNew = {},
        properties = 0,
        year;

    year = '20' + course.name.replace(/[A-Z]/ig, '').substr(0, 2);
    year = parseInt(year);

    courseNew.name = course.name;
    ++properties;

    courseNew.year = year;
    ++properties;

    if (course.kurssprecherName !== '') {
        ++properties;
        courseNew.representativeLastName = course.kurssprecherName;
    }
    if (course.kurssprecherVorname !== '') {
        ++properties;
        courseNew.representativeFirstName = course.kurssprecherVorname;
    }
    if (course.kurssprecherTelefon !== '') {
        ++properties;
        courseNew.representativePhone = course.kurssprecherTelefon;
    }
    if (course.kurssprecherMail !== '') {
        ++properties;
        courseNew.representativeMail = course.kurssprecherMail;
    }
    if (course.kursMail !== '') {
        ++properties;
        courseNew.courseMailingList = course.kursMail;
    }
    if (course.studentenAnzahl !== '') {
        ++properties;
        courseNew.numberOfStudents = course.studentenAnzahl;
    }

    return {
        cypher:
            'MATCH (s:Secretary ' +
            '{userName:\'' + course.sekretariat + '\'}), ' +
            '(mp:ModulePlan {id:' + course.idModulplan + '}), ' +
            '(h:Head {lastName:\'' + course.studiengangsleiterName + '\'}) ' +
            'CREATE (c:Course {props}), (s)-[:manages]->(c), ' +
            '(c)<-[:isHeadOf]-(h), ' +
            '(c)-[:follows]->(mp);',
        parameter: {
            props: courseNew
        },
        expectedStats: {
            nodes_created: 1,
            relationships_created: 3,
            properties_set: properties,
            labels_added: 1,
            contains_updates: true
        }
    };
};

