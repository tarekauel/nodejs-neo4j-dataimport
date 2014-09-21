/**
 * @author Tarek Auel
 */
var winston = require('winston'),
    logger,
    neo4j = require('./lib/neo4j.js'),
    DATA_PATH = './data/',
    fs = require('fs'),
    docent = require('./lib/docent.js'),
    lecture = require('./lib/lecture.js'),
    modulePlan = require('./lib/modulePlan.js'),
    module = require('./lib/module.js'),
    user = require('./lib/user.js'),
    course = require('./lib/course.js'),
    lectureSeries = require('./lib/lectureSeries.js'),
    event = require('./lib/event.js'),
    semester = require('./lib/semester.js'),
    status = require('./lib/status.js'),
    lectureType = require('./lib/lectureType.js'),
    teaching = require('./lib/teaching.js'),
    moduleToModulePlan = require('./lib/moduleToModulePlans.js'),
    moduleToLecture = require('./lib/moduleToLecture.js'),
    docentUser = require('./lib/docentUser.js'),
    room = require('./lib/room.js'),
    self = this;

logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ level: 'info', colorize: true }),
        new (winston.transports.File)({ filename: './log/migration.log', level: 'verbose' })
    ]
});

neo4j.setLogger(logger);

/**
 * Creates the indexes
 */
this.saveConstraints = function() {
    var cypherStatements =
        [
            'CREATE CONSTRAINT ON (s:Status) ASSERT s.id IS UNIQUE',
            'CREATE CONSTRAINT ON (lt:LectureType) ASSERT lt.id IS UNIQUE',
            'CREATE CONSTRAINT ON (d:Docent) ASSERT d.id IS UNIQUE',
            'CREATE CONSTRAINT ON (l:Lecture) ASSERT l.id IS UNIQUE',
            'CREATE CONSTRAINT ON (mp:ModulePlans) ASSERT mp.id IS UNIQUE',
            'CREATE CONSTRAINT ON (m:Module) ASSERT m.id IS UNIQUE',
            'CREATE CONSTRAINT ON (u:User) ASSERT u.id IS UNIQUE',
            'CREATE CONSTRAINT ON (c:Course) ASSERT c.name IS UNIQUE',
            'CREATE CONSTRAINT ON (r:Room) ASSERT r.name IS UNIQUE',
            'CREATE CONSTRAINT ON (e:Event) ASSERT e.id IS UNIQUE'
        ];

    var expectedCallbacks = cypherStatements.length;
    var receivedCallbacks = 0;
    var queryNext = function(cypher, index) {
        var expectedStats = {
            constraints_added: 1,
            contains_updates: true
        };
        neo4j.query(cypher,
            null,
            expectedStats,
            function(err) {
                if (err)
                    throw err;
                ++receivedCallbacks;
                if (expectedCallbacks === receivedCallbacks) {
                    logger.info(
                            'Saved ' + expectedCallbacks + ' constraints');
                    self.saveIndexes();
                } else {
                    ++index;
                    queryNext(cypherStatements[index], index);
                }
            }
        );
    };
    queryNext(cypherStatements[0], 0);
};

/**
 * Creates indexes for better performance
 */
this.saveIndexes = function() {
    var cypherStatements =
        [
            'CREATE INDEX ON :Docent(lastName)'
        ];
    var expectedCallbacks = cypherStatements.length;
    var receivedCallbacks = 0;
    var queryNext = function(cypher, index) {
        var expectedStats = {
            indexes_added: 1,
            contains_updates: true
        };
        neo4j.query(cypher, null, expectedStats,
            function(err) {
                if (err)
                    throw err;
                ++receivedCallbacks;
                if (expectedCallbacks === receivedCallbacks) {
                    logger.info('Saved ' + expectedCallbacks + ' indexes');
                    self.saveAllRooms();
                    self.saveStatus();
                    self.saveLectureTypes();
                    self.saveModulePlans();
                    self.saveModules();
                    self.saveUsersForSecretary();
                } else {
                    ++index;
                    queryNext(cypherStatements[index], index);
                }
            }
        );
    };
    queryNext(cypherStatements[0], 0);
};

/**
 * Saves the different status that a docent can have
 */
this.saveStatus = function() {
    var statusArray = [1, 2, 3],
        expectedCallbacks = statusArray.length,
        receivedCallbacks = 0;
    statusArray.forEach(function(statusId) {
        var newStatus = new status(statusId);
        neo4j.query(newStatus.cypher,
            newStatus.parameter,
            newStatus.expectedStats,
            function(err) {
                if (err)
                    throw err;
                ++receivedCallbacks;
                if (expectedCallbacks === receivedCallbacks) {
                    self.saveDocents();
                }
            }
        );
    });
};


/**
 * Saves the different lecture types
 */
this.saveLectureTypes = function() {
    var typeArray = [0, 1, 2],
        expectedCallbacks = typeArray.length,
        receivedCallbacks = 0;
    typeArray.forEach(function(typeId) {
        var newLectureType = new lectureType(typeId);
        neo4j.query(newLectureType.cypher,
            newLectureType.parameter,
            newLectureType.expectedStats,
            function(err) {
                if (err) {
                    throw err;
                }
                ++receivedCallbacks;
                if (expectedCallbacks === receivedCallbacks) {
                    logger.info('Saved ' + expectedCallbacks + ' ' +
                    'lecture types');
                    self.saveLectures();
                }
            }
        );
    });
};

/**
 * Adds the docents of the old database to the new database
 */
this.saveDocents = function() {
    var fileName = 'dozenten.json';
    fs.readFile(DATA_PATH + fileName, 'utf8', function(err, data) {
        if (err) {
            return logger.info(err);
        }
        var docentArray = JSON.parse(data),
            expectedCallbacks = docentArray.length,
            receivedCallback = 0;
        docentArray.forEach(function(docentOld) {
            var newDocent = new docent(docentOld);
            neo4j.query(newDocent.cypher,
                newDocent.parameter,
                newDocent.expectedStats,
                function(err) {
                    if (err)
                        throw err;
                    receivedCallback++;
                    if (expectedCallbacks === receivedCallback) {
                        logger.info(
                                'Saved ' + expectedCallbacks + ' docents');
                        self.saveTeachings();
                        self.saveUsersForDocents();
                        self.saveNewLectureSeries();
                    }
                }
            );
        });
    });
};


var numOfCallsOfSaveTeachings = 0;
/**
 * Creates the associations between docents and their lectures
 */
this.saveTeachings = function() {
    ++numOfCallsOfSaveTeachings;
    if (numOfCallsOfSaveTeachings < 2) {
        return;
    }
    var fileName = 'dozent_lehrt.json';
    fs.readFile(DATA_PATH + fileName, 'utf8', function(err, data) {
        if (err) {
            return logger.info(err);
        }
        var teachesArray = JSON.parse(data),
            expectedCallbacks = teachesArray.length,
            receivedCallbacks = 0;
        teachesArray.forEach(function(teaches) {

            if (teaches.idDozent === 0) {
                logger.debug('Skipped a teaching (docent ' + teaches.idDozent + ' does not exist)');
                return;
            }

            if ([0, 508].indexOf(teaches.idFach) !== -1) {
                logger.debug('Skipped a teaching (lecture ' + teaches.idFach + ' does not exist)');
                return;
            }

            var newTeaching = new teaching(teaches);

            neo4j.query(newTeaching.cypher,
                newTeaching.parameter,
                newTeaching.expectedStats,
                function(err) {
                    if (err)
                        throw err;
                    ++receivedCallbacks;
                    if (expectedCallbacks === receivedCallbacks) {
                        logger.info(
                                'Saved ' + expectedCallbacks + ' teachings');
                        // DO NEXT COOL STUFF
                    }
                }
            );
        });
    });
};

/**
 * Saves all lectures
 */
this.saveLectures = function() {
    var fileName = 'fach.json';
    fs.readFile(DATA_PATH + fileName, 'utf8', function(err, data) {
        if (err) {
            return logger.info(err);
        }
        var lectureArray = JSON.parse(data),
            expectedCallbacks = lectureArray.length,
            receivedCallbacks = 0;
        lectureArray.forEach(function(lectureOld) {
            var newLecture = new lecture(lectureOld);
            neo4j.query(newLecture.cypher,
                newLecture.parameter,
                newLecture.expectedStats,
                function(err) {
                    if (err)
                        throw err;
                    ++receivedCallbacks;
                    if (expectedCallbacks === receivedCallbacks) {
                        logger.info(
                                'Saved ' + expectedCallbacks + ' lectures');
                        self.saveTeachings();
                        self.saveModuleLecture();
                        self.saveNewLectureSeries();
                    }
                }
            );
        });
    });
};

/**
 * saves all module plans
 */
this.saveModulePlans = function() {
    var fileName = 'modulplan.json';
    fs.readFile(DATA_PATH + fileName, 'utf8', function(err, data) {
        if (err) {
            throw err;
        }
        var modulePlanArray = JSON.parse(data),
            expectedCallbacks = modulePlanArray.length,
            receivedCallbacks = 0;
        modulePlanArray.forEach(function(modulePlanOld) {
            var modulePlanNew = new modulePlan(modulePlanOld);
            neo4j.query(modulePlanNew.cypher,
                modulePlanNew.parameter,
                modulePlanNew.expectedStats,
                function(err) {
                    if (err)
                        throw err;
                    ++receivedCallbacks;
                    if (expectedCallbacks === receivedCallbacks) {
                        logger.info(
                                'Saved ' + expectedCallbacks + ' module plans');
                        self.saveModulesToModulePlans();
                        self.saveCourses();
                    }
                }
            );
        });
    });
};

/**
 * Saves all modules
 */
this.saveModules = function() {
    var filename = 'module.json';
    fs.readFile(DATA_PATH + filename, 'utf8', function(err, data) {
        if (err) {
            throw err;
        }
        var moduleArray = JSON.parse(data),
            expectedCallbacks = moduleArray.length,
            receivedCallbacks = 0;
        moduleArray.forEach(function(moduleOld) {
            var moduleNew = new module(moduleOld);
            neo4j.query(moduleNew.cypher,
                moduleNew.parameter,
                moduleNew.expectedStats,
                function(err) {
                    if (err)
                        throw err;
                    ++receivedCallbacks;
                    if (expectedCallbacks === receivedCallbacks) {
                        logger.info(
                                'Saved ' + expectedCallbacks + ' modules');
                        self.saveModuleLecture();
                        self.saveModulesToModulePlans();
                    }
                }
            );
        });
    });
};

var numOfCallsOfSaveModulesToModulePlans = 0;
/**
 * Saves all associations between modules and module plans
 */
this.saveModulesToModulePlans = function() {
    numOfCallsOfSaveModulesToModulePlans++;
    if (numOfCallsOfSaveModulesToModulePlans < 2) {
        // modules and module plans has to be created first!
        return;
    }
    var filename = 'modulplan_modul.json';
    fs.readFile(DATA_PATH + filename, 'utf8', function(err, data) {
        if (err) {
            return logger.info(err);
        }
        var mappingArray = JSON.parse(data),
            expectedCallbacks = mappingArray.length,
            receivedCallbacks = 0;
        mappingArray.forEach(function(mapping) {
            var newMapping = new moduleToModulePlan(mapping);
            neo4j.query(newMapping.cypher,
                newMapping.parameter,
                newMapping.expectedStats,
                function(err) {
                    if (err)
                        throw err;
                    ++receivedCallbacks;
                    if (expectedCallbacks === receivedCallbacks) {
                        logger.info(
                                'Saved ' + expectedCallbacks + ' module to ' +
                                'module plans mappings');
                        // DO NEXT STUFF
                    }
                }
            );
        });
    });
};

var numOfCallsOfSaveModuleLecture = 0;
/**
 * Saves all associations between modules and lectures
 */
this.saveModuleLecture = function() {
    ++numOfCallsOfSaveModuleLecture;
    if (numOfCallsOfSaveModuleLecture < 2) {
        return; // Module plans and lectures has to be created first!
    }
    var fileName = 'modul_fach.json';
    fs.readFile(DATA_PATH + fileName, 'utf8', function(err, data) {
        if (err) {
            return logger.info(err);
        }
        var moduleLecture = JSON.parse(data),
            expectedCallbacks = moduleLecture.length,
            receivedCallbacks = 0;
        moduleLecture.forEach(function(mapping) {
            var newMapping = new moduleToLecture(mapping);
            neo4j.query(newMapping.cypher,
                newMapping.parameter,
                newMapping.expectedStats,
                function(err) {
                    if (err)
                        throw err;
                    ++receivedCallbacks;
                    if (expectedCallbacks === receivedCallbacks) {
                        logger.info(
                                'Saved ' + expectedCallbacks + ' module to ' +
                                'lecture mapping');
                        // DO NEXT COOL STUFF
                    }
                }
            );
        });
    });
};

/**
 * Creates the label user for docents that were user in the old system.
 * Besides it sets their username
 */
this.saveUsersForDocents = function() {
    var fileName = 'user_dozent.json';
    fs.readFile(DATA_PATH + fileName, 'utf8', function(err, data) {
        if (err) {
            return logger.info(err);
        }
        var mappingArray = JSON.parse(data),
            expectedCallbacks = mappingArray.length,
            receivedCallbacks = 0;
        mappingArray.forEach(function(mapping) {
            var newDocentUser = new docentUser(mapping);
            neo4j.query(newDocentUser.cypher,
                newDocentUser.parameter,
                newDocentUser.expectedStats,
                function(err) {
                    if (err)
                        throw err;
                    ++receivedCallbacks;
                    if (expectedCallbacks === receivedCallbacks) {
                        logger.info(
                                'Saved ' + expectedCallbacks + ' ' +
                                'users for docents');
                        self.saveLabelForHeads();
                    }
                }
            );
        });
    });
};

/**
 * creates users for the secretaries
 */
this.saveUsersForSecretary = function() {
    var fileName = 'user_sekretariat.json';
    fs.readFile(DATA_PATH + fileName, 'utf8', function(err, data) {
        if (err) {
            return logger.info(err);
        }
        var mappingArray = JSON.parse(data),
            expectedCallbacks = mappingArray.length,
            receivedCallbacks = 0;
        mappingArray.forEach(function(userOld) {
            var userNew = new user(userOld),
                parameter = {
                    props: userNew
                },
                cypherStatement =
                'CREATE (:User:Secretary {props});';
            var expectedStats = {
                properties_set: 1,
                labels_added: 2,
                nodes_created: 1,
                contains_updates: true
            };
            neo4j.query(cypherStatement,
                parameter,
                expectedStats,
                function(err) {
                    if (err)
                        throw err;
                    ++receivedCallbacks;
                    if (expectedCallbacks === receivedCallbacks) {
                        logger.info(
                                'Saved ' + expectedCallbacks + ' ' +
                                'users for secretaries');
                        self.saveCourses();
                    }
                }
            );
        });
    });
};

/**
 * adds labels for the heads of the courses
 */
this.saveLabelForHeads = function() {
    var fileName = 'user_studiengangsleiter.json';
    fs.readFile(DATA_PATH + fileName, 'utf8', function(err, data) {
        if (err) {
            return logger.info(err);
        }
        var mappingArray = JSON.parse(data),
            expectedCallbacks = mappingArray.length,
            receivedCallbacks = 0;
        mappingArray.forEach(function(user) {
            var cypherStatement =
                    'MATCH (u:User {userName:\'' + user.user_name + '\'}) ' +
                    'SET u:Head;';
            var expectedStats = {
                labels_added: 1,
                contains_updates: true
            };
            neo4j.query(cypherStatement,
                {},
                expectedStats,
                function(err) {
                    if (err)
                        throw err;
                    ++receivedCallbacks;
                    if (expectedCallbacks === receivedCallbacks) {
                        logger.info(
                                'Saved ' + expectedCallbacks + ' ' +
                                'labels for heads');
                        self.saveCourses();
                    }
                }
            );
        });
    });
};

var numOfCallsOfSaveCourses = 0;
/**
 * saves the courses
 */
this.saveCourses = function() {
    numOfCallsOfSaveCourses++;
    if (numOfCallsOfSaveCourses < 3) {
        return;
    }
    var fileName = 'kurse.json';
    fs.readFile(DATA_PATH + fileName, 'utf8', function(err, data) {
        if (err) {
            return logger.info(err);
        }
        var courseArray = JSON.parse(data),
            expectedCallbacks = courseArray.length,
            receivedCallbacks = 0;
        courseArray.forEach(function(courseOld) {
            var newCourse = new course(courseOld);
            neo4j.query(newCourse.cypher,
                newCourse.parameter,
                newCourse.expectedStats,
                function(err) {
                    if (err)
                        throw err;
                    ++receivedCallbacks;
                    if (expectedCallbacks === receivedCallbacks) {
                        logger.info(
                                'Saved ' + expectedCallbacks + ' courses');
                        self.saveNewLectureSeries();
                        self.saveSemester();
                    }
                }
            );
        });
    });
};

/**
 * saves all rooms
 */
this.saveAllRooms = function() {
    var fileName = 'raumListe.json';
    fs.readFile(DATA_PATH + fileName, 'utf8', function(err, data) {
        if (err) {
            return logger.info(err);
        }
        var roomArray = JSON.parse(data),
            expectedCallbacks = roomArray.length,
            receivedCallbacks = 0;
        roomArray.forEach(function(roomOld) {
            var newRoom = new room(roomOld);
            neo4j.query(newRoom.cypher,
                newRoom.parameter,
                newRoom.expectedResults,
                function(err) {
                    if (err)
                        throw err;
                    ++receivedCallbacks;
                    if (expectedCallbacks === receivedCallbacks) {
                        logger.info(
                                'Saved ' + expectedCallbacks + ' rooms');
                        self.saveNewLectureSeries();
                        self.saveSemester();
                    }
                }
            );
        });
    });
};

var numberOfCallsOfSaveLectureSeries = 0;
/**
 * saves the lecture series
 */
this.saveNewLectureSeries = function() {
    numberOfCallsOfSaveLectureSeries++;
    if (numberOfCallsOfSaveLectureSeries < 4) {
        return;
    }
    var fileName = 'vorlesungsSerien.json';
    fs.readFile(DATA_PATH + fileName, 'utf8', function(err, data) {
        if (err) {
            throw err;
        }
        var lectureSeriesArray = JSON.parse(data),
            expectedCallbacks = lectureSeriesArray.length,
            receivedCallbacks = 0;
        lectureSeriesArray.forEach(function(lectureSeriesOld) {
            if ([204, 20].indexOf(lectureSeriesOld.idDozent) !== -1) {
                // some docents don't exist
                lectureSeriesOld.idDozent = 0;
            }
            var newLectureSeries = new lectureSeries(lectureSeriesOld);
            neo4j.query(newLectureSeries.cypher,
                newLectureSeries.parameter,
                newLectureSeries.expectedStats,
                function(err) {
                    if (err) {
                        throw err;
                    }
                    ++receivedCallbacks;
                    if (expectedCallbacks === receivedCallbacks) {
                        logger.info(
                                'Saved ' + expectedCallbacks + ' ' +
                                'lecture series');
                        self.saveEvents();
                    }
                }
            );
        });
    });
};

/**
 * saves events
 */
this.saveEvents = function() {
    var fileName = 'events.json';
    fs.readFile(DATA_PATH + fileName, 'utf8', function(err, data) {
        if (err) {
            throw err;
        }
        var eventsArray = JSON.parse(data),
            expectedCallbacks = eventsArray.length,
            receivedCallbacks = 0;
        eventsArray.forEach(function(eventOld) {
            if ([1724, 1873, 1901, 2000, 1855, 2062,
                    2156, 2323, 2873, 3201, 3311, 3315, 3479]
                    .indexOf(eventOld.idVorlesung) !== -1) {
                // some lecture series don't exist
                --expectedCallbacks;
                return;
            }
            var newEvent = new event(eventOld);
            neo4j.query(newEvent.cypher,
                newEvent.parameter,
                newEvent.expectedStats,
                function(err) {
                    if (err) {
                        throw err;
                    }
                    ++receivedCallbacks;
                    if (expectedCallbacks === receivedCallbacks) {
                        logger.info(
                                'Saved ' + expectedCallbacks + ' events');
                        //DO NEXT COOL STUFF
                    }
                }
            );
        });
    });
};

var numOfCallsOfSaveSemester = 0;

/**
 * saves semesters
 */
this.saveSemester = function() {
    ++numOfCallsOfSaveSemester;
    if (numOfCallsOfSaveSemester < 2) {
        return;
    }
    var fileName = 'blocklage.json';
    fs.readFile(DATA_PATH + fileName, 'utf8', function(err, data) {
        if (err) {
            throw err;
        }
        var semesterArray = JSON.parse(data),
            expectedCallbacks = semesterArray.length,
            receivedCallbacks = 0;
        semesterArray.forEach(function(semesterOld) {
            var newSemester = new semester(semesterOld);
            neo4j.query(newSemester.cypher,
                newSemester.parameter,
                newSemester.expectedStats,
                function(err) {
                    if (err)
                        throw err;
                    ++receivedCallbacks;
                    if (expectedCallbacks === receivedCallbacks) {
                        logger.info(
                                'Saved ' + expectedCallbacks + ' semesters');
                        //DO NEXT COOL STUFF
                    }
                }
            );
        });
    });
};

this.saveConstraints();
