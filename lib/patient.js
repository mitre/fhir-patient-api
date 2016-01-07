"use strict";

let Future = require('fibers/future');
let core = require('./core.js');
let encounter = require('./encounter.js');
let medication = require('./medication.js');
let condition = require('./condition.js');
let procedure = require('./procedure.js');
let observation = require('./observation.js');
let immunization = require('./immunization.js');
let language = require('./language.js');

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

  id() {
    return this.patientId;
  }

  medicalRecordNumber() {
    this.populate();
    return this.fhirModel.identifier;
  }

  firstFullName() {
    this.populate();
    if (this.fhirModel.name != null) {
      return this.fhirModel.name[0];
    } else {
      return null;
    }
  }

  given() {
    let ffn = this.firstFullName();
    if (ffn != null && ffn.given != null) {
      return ffn.given[0];
    } else {
      return null;
    }
  }

  last() {
    this.populate();
    let ffn = this.firstFullName();
    if (ffn != null && ffn.family != null) {
      return ffn.family[0];
    } else {
      return null;
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

  languages() {
    if (this.fhirModel.communication != null) {
      let lang = [];
      for (var i = 0; i < this.fhirModel.communication.length; i++) {
        let c = this.fhirModel.communication[i];
        lang.push(new language.Language(c));
      }
      return lang;
    } else {
      return null;
    }
  }

  // This should be private, but JavaScript doesn't have anything like that
  loadSection(collectionName, patientReference, DesiredClass) {
    let collection = this.db.collection(collectionName);
    let future = new Future();
    let query = {};
    query[patientReference] = this.patientId;
    collection.find(query).toArray(future.resolver());
    let sectionEntries = new core.CodedEntryList();
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

  immunizations() {
    if (this._immunizations == null) {
      this._immunizations = this.loadSection('immunizations', 'patient.referenceid', immunization.Immunization);
    }
    return this._immunizations;
  }
}

module.exports = {Patient: Patient};
