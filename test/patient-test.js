"use strict";

let assert = require('assert');
let fhir = require('../lib/patient.js');
let Fiber = require('fibers');
let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let fs = require('fs');
let async = require('async');

let database = null;
let patientId = new mongo.ObjectId();
let encounterId = new mongo.ObjectId();
let medId = new mongo.ObjectId();
let conditionId = new mongo.ObjectId();
let procedureId = new mongo.ObjectId();
let observationId =  new mongo.ObjectId();
let immunizationId =  new mongo.ObjectId();

function loadFixture(fixtureFile, id) {
  let fixtureJSON = fs.readFileSync(fixtureFile);
  let f = JSON.parse(fixtureJSON);
  f._id = id;
  convertDates(f);
  return f;
}

function convertDates(obj) {
  for (let propertyName in obj) {
    if (obj.hasOwnProperty(propertyName) && obj[propertyName].hasOwnProperty("time")) {
      obj[propertyName].time = new Date(obj[propertyName].time);
    } else {
      if (typeof obj[propertyName] === "object") {
        convertDates(obj[propertyName]);
      }
    }
  }
}

describe('Patient', () => {
  before((done) => {
    MongoClient.connect('mongodb://127.0.0.1:27017/fhir-test', function(err, db) {
      database = db;

      let p = loadFixture("./test/fixtures/patient.json", patientId);
      let e = loadFixture("./test/fixtures/office-encounter.json", encounterId);
      let m = loadFixture("./test/fixtures/med-statement.json", medId);
      let c = loadFixture("./test/fixtures/condition.json", conditionId);
      let procedure = loadFixture("./test/fixtures/procedure.json", procedureId);
      let o = loadFixture("./test/fixtures/observation.json", observationId);
      let i = loadFixture("./test/fixtures/immunization.json", immunizationId);

      e.patient = {'referenceid': patientId};
      m.patient = {'referenceid': patientId};
      c.patient = {'referenceid': patientId};
      procedure.subject = {'referenceid': patientId};
      o.subject = {'referenceid': patientId};
      i.patient = {'referenceid': patientId};
      async.parallel([
        (callback) => {db.collection('patients').insertOne(p, {}, () => {callback(null);});},
        (callback) => {db.collection('encounters').insertOne(e, {}, () => {callback(null);});},
        (callback) => {db.collection('medicationstatements').insertOne(m, {}, () => {callback(null);});},
        (callback) => {db.collection('conditions').insertOne(c, {}, () => {callback(null);});},
        (callback) => {db.collection('procedures').insertOne(procedure, {}, () => {callback(null);});},
        (callback) => {db.collection('observations').insertOne(o, {}, () => {callback(null);});},
        (callback) => {db.collection('immunizations').insertOne(i, {}, () => {callback(null);});}
      ], (err) => {done(err);});
    });
  });

  it('has a gender', (done) => {
    new Fiber(() => {
      let patient = new fhir.Patient(database, patientId);
      let gender = patient.gender();
      assert.equal("F", gender);
      done();
    }).run();
  });

  it('has a birth time', (done) => {
    new Fiber(() => {
      let patient = new fhir.Patient(database, patientId);
      let bt = patient.birthtime();
      assert.equal(1944, bt.getFullYear());
      done();
    }).run();
  });

  it('has a marital status', (done) => {
    new Fiber(() => {
      let patient = new fhir.Patient(database, patientId);
      let ms = patient.maritalStatus();
      assert.equal('M', ms.code());
      done();
    }).run();
  });

  it('has a given name', (done) => {
    new Fiber(() => {
      let patient = new fhir.Patient(database, patientId);
      assert.equal('Joan', patient.given());
      done();
    }).run();
  });

  it('has encounters', (done) => {
    new Fiber(() => {
      let patient = new fhir.Patient(database, patientId);
      let encounters = patient.encounters();
      assert.equal(1, encounters.length);
      let e = encounters[0];
      assert.equal(new Date("2015-10-12T00:00:00.000Z").getTime(), e.startDate().getTime());
      done();
    }).run();
  });

  it('has medications', (done) => {
    new Fiber(() => {
      let patient = new fhir.Patient(database, patientId);
      let medications = patient.medications();
      assert.equal(1, medications.length);
      let m = medications[0];
      assert.equal(new Date("2011-11-15T00:00:00.000Z").getTime(), m.startDate().getTime());
      done();
    }).run();
  });

  it('has conditions', (done) => {
    new Fiber(() => {
      let patient = new fhir.Patient(database, patientId);
      let conditions = patient.conditions();
      assert.equal(1, conditions.length);
      let c = conditions[0];
      assert.equal(new Date("2011-06-03T00:00:00.000Z").getTime(), c.startDate().getTime());
      assert.equal("255604002", c.severity().code());
      done();
    }).run();
  });

  it('has procedures', (done) => {
    new Fiber(() => {
      let patient = new fhir.Patient(database, patientId);
      let procedures = patient.procedures();
      assert.equal(1, procedures.length);
      let p = procedures[0];
      assert.equal(new Date("2013-01-28T13:31:00+01:00").getTime(), p.startDate().getTime());
      assert.equal("272676008", p.site().code());
      assert.equal("385669000", p.values()[0].code())
      done();
    }).run();
  });

  it('has observations', (done) => {
    new Fiber(() => {
      let patient = new fhir.Patient(database, patientId);
      let observations = patient.results();
      assert.equal(1, observations.length);
      let o = observations[0];
      assert.equal(new Date("2014-10-11T00:00:00.000Z").getTime(), o.date().getTime());
      assert.equal(247.0, o.values()[0].scalar());
      assert.equal("mg/dL", o.values()[0].units());
      done();
    }).run();
  });

  it('has immunizations', (done) => {
    new Fiber(() => {
      let patient = new fhir.Patient(database, patientId);
      let immunizations = patient.immunizations();
      assert.equal(1, immunizations.length);
      let i = immunizations[0];
      assert.equal(new Date("2013-01-10").getTime(), i.date().getTime());
      done();
    }).run();
  });

  it('has json property for clinical data elements ', (done) => {
    new Fiber(() => {
      let patient = new fhir.Patient(database, patientId);
      let immunizations = patient.immunizations();
      let observations = patient.results();
      let procedures = patient.procedures();
      let conditions = patient.conditions();
      let medications = patient.medications();
      let encounters = patient.encounters();

      let e = encounters[0];
      let m = medications[0];
      let c = conditions[0];
      let p = procedures[0];
      let o = observations[0];
      let i = immunizations[0];

      assert.equal(e.fhirModel, e.json);
      assert.equal(m.fhirModel, m.json);
      assert.equal(c.fhirModel, c.json);
      assert.equal(p.fhirModel, p.json);
      assert.equal(o.fhirModel, o.json);
      assert.equal(i.fhirModel, i.json);

      assert.notEqual(e.fhirModel, null);
      assert.notEqual(m.fhirModel, null);
      assert.notEqual(c.fhirModel, null);
      assert.notEqual(p.fhirModel, null);
      assert.notEqual(o.fhirModel, null);
      assert.notEqual(i.fhirModel, null);

      done();
    }).run();
  });

  after(() => {
    database.collection("patients").drop();
    database.collection("encounters").drop();
    database.collection("medicationstatements").drop();
    database.collection("conditions").drop();
    database.collection("procedures").drop();
    database.collection("observations").drop();
    database.collection("immunizations").drop();
    database.close();
  });
});
