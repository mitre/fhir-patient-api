"use strict";

let assert = require('assert');
let fhir = require('../lib/patient.js');
let Fiber = require('fibers');
let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let fs = require('fs');

let database = null;
let patientId = new mongo.ObjectId();

describe('Patient', () => {
  before((done) => {
    MongoClient.connect('mongodb://127.0.0.1:27017/fhir-test', function(err, db) {
      database = db;
      let patientFixture = fs.readFileSync("./test/fixtures/patient.json");
      let p = JSON.parse(patientFixture);
      p.birthDate.time = new Date(p.birthDate.time);
      p._id = patientId;
      db.collection('patients').insertOne(p, {}, () => {
        done();
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

  after(() => {
    database.collection("patients").drop();
    database.close();
  });
});
