"use strict";

let Future = require('fibers/future');
let core = require('./core.js');

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

  encounters() {
    let encounterCollection = this.db.collection('encounters');
    
  }
}

module.exports = {Patient: Patient};
