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

      e.patient = {'referenceid': patientId};
      m.patient = {'referenceid': patientId};
      c.patient = {'referenceid': patientId};
      async.parallel([
        (callback) => {db.collection('patients').insertOne(p, {}, () => {callback(null);});},
        (callback) => {db.collection('encounters').insertOne(e, {}, () => {callback(null);});},
        (callback) => {db.collection('medicationstatements').insertOne(m, {}, () => {callback(null);});},
        (callback) => {db.collection('conditions').insertOne(c, {}, () => {callback(null);});}
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
      done();
    }).run();
  });

  after(() => {
    database.collection("patients").drop();
    database.collection("encounters").drop();
    database.collection("medicationstatements").drop();
    database.collection("conditions").drop();
    database.close();
  });
});
