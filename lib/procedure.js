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

    this._type = core.unrollCodeableConcepts(this.fhirModel.code);
  }

  site() {
    return core.firstCode(this.fhirModel.bodySite);
  }
}

module.exports = {Procedure: Procedure};
