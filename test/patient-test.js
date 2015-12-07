"use strict";

let assert = require('assert');
let fhir = require('../lib/patient.js');
let Fiber = require('fibers');
let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let fs = require('fs');

let database = null;
let patientId = new mongo.ObjectId();
let encounterId = new mongo.ObjectId();

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
      e.patient = {'referenceid': patientId};
      db.collection('patients').insertOne(p, {}, () => {
        db.collection('encounters').insertOne(e, {}, () => {
          done();
        });
      });
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
      done();
    }).run();
  });

  after(() => {
    database.collection("patients").drop();
    database.collection("encounters").drop();
    database.close();
  });
});
