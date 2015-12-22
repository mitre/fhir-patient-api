"use strict";

let Future = require('fibers/future');
let core = require('./core.js');
let encounter = require('./encounter.js');
let medication = require('./medication.js');
let condition = require('./condition.js');
let procedure = require('./procedure.js');
let observation = require('./observation.js');

class Patient {
  constructor(db, patientId) {
    this.db = db;
    this.patientId = patientId;
    this.populated = false;
  }

  // Populates the FHIR model
  // If already populated, it does nothing
  populate() {
    if (this.populated === false) {
      let patientCollection = this.db.collection('patients');
      let future = new Future();
      patientCollection.findOne({"_id": this.patientId}, {}, future.resolver());
      this.fhirModel = future.wait();
      this.populated = true;
    }
  }

  gender() {
    this.populate();
    let genderWord = this.fhirModel.gender;
    if (genderWord == null) {
      return null;
    } else {
      return genderWord.substring(0, 1).toUpperCase();
    }
  }

  birthtime() {
    this.populate();
    return this.fhirModel.birthDate.time;
  }

  maritalStatus() {
    this.populate();
    let msCode = this.fhirModel.maritalStatus;
    if (msCode == null) {
      return null;
    } else {
      return new core.CodedValue(msCode.coding[0].code, msCode.coding[0].system);
    }
  }

  expired() {
    this.populate();
    return this.fhirModel.deceasedBoolean;
  }

  // Stub for now. Not a core part of FHIR
  // It is included in DAF Profile of Patient
  race() {
    return null;
  }

  // Stub for now. Not a core part of FHIR
  // It is included in DAF Profile of Patient
  ethnicity() {
    return null;
  }

  // This should be private, but JavaScript doesn't have anything like that
  loadSection(collectionName, patientReference, DesiredClass) {
    let collection = this.db.collection(collectionName);
    let future = new Future();
    let query = {};
    query[patientReference] = this.patientId;
    collection.find(query).toArray(future.resolver());
    let sectionEntries = [];
    let fhirObjects = future.wait();
    for (let i = 0; i < fhirObjects.length; i++) {
      let fo = fhirObjects[i];
      sectionEntries.push(new DesiredClass(fo));
    }
    return sectionEntries;
  }

  encounters() {
    if (this._encounters == null) {
      this._encounters = this.loadSection('encounters', 'patient.referenceid', encounter.Encounter);
    }
    return this._encounters;
  }

  medications() {
    if (this._medications == null) {
      this._medications = this.loadSection('medicationstatements', 'patient.referenceid', medication.Medication);
    }
    return this._medications;
  }

  conditions() {
    if (this._conditions == null) {
      this._conditions = this.loadSection('conditions', 'patient.referenceid', condition.Condition);
    }
    return this._conditions;
  }

  procedures() {
    if (this._procedures == null) {
      this._procedures = this.loadSection('procedures', 'subject.referenceid', procedure.Procedure);
    }
    return this._procedures;
  }

  results() {
    if (this._observations == null) {
      this._observations = this.loadSection('observations', 'subject.referenceid', observation.Observation);
    }
    return this._observations;
  }
}

module.exports = {Patient: Patient};
