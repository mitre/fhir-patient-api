"use strict";

let core = require('./core.js');

class Condition extends core.CodedEntry {
  constructor(fhirModel) {
    super();
    this.fhirModel = fhirModel;
    if (fhirModel.onsetDateTime != null) {
      this._startDate = fhirModel.onsetDateTime.time;
    }
    if (fhirModel.abatementDateTime != null) {
      this._endDate = fhirModel.abatementDateTime.time;
    }
    this._type = core.unrollCodeableConcept(this.fhirModel.code);
    this._status = fhirModel.clinicalStatus;
  }

  severity() {
    return core.firstCodedValue(this.fhirModel.severity);
  }
}

module.exports = {Condition: Condition};
