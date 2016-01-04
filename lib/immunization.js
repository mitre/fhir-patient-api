"use strict";

let core = require('./core.js');

class Immunization extends core.CodedEntry {
  constructor(fhirModel) {
    super();
    this.fhirModel = fhirModel;
    if (this.fhirModel.date != null) {
      this._date = this.fhirModel.date.time;
    }
    this._type = core.unrollCodeableConcepts(this.fhirModel.vaccineCode);
  }

  refusalInd() {
    return this.fhirModel.wasNotGiven;
  }
}

module.exports = {Immunization: Immunization};
