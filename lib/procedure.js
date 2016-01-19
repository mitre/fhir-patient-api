"use strict";

let core = require('./core.js');

class Procedure extends core.CodedEntry {
  constructor(fhirModel) {
    super();
    this.fhirModel = fhirModel;
    if (fhirModel.performedDateTime != null) {
      this._date = fhirModel.performedDateTime.time;
    }
    if (fhirModel.performedPeriod != null) {
      this.extractPeriodToStartAndEnd(this.fhirModel.performedPeriod);
    }

    this._type = core.unrollCodeableConcept(this.fhirModel.code);
  }

  site() {
    if (this.fhirModel.bodySite.length >= 1) {
      return core.firstCodedValue(this.fhirModel.bodySite[0]);
    } else {
      return null;
    }
  }

  values(){
    if(this.fhirModel.outcome){
      return core.unrollCodeableConcept(this.fhirModel.outcome);
    }else{
      return new core.CodedEntryList();
    }
  }
}

module.exports = {Procedure: Procedure};
