"use strict";

let core = require('./core.js');

class Encounter extends core.CodedEntry {
  constructor(fhirModel) {
    super();
    this.fhirModel = fhirModel;
    this.extractPeriodToStartAndEnd(this.fhirModel.period);
    this._type = core.unrollCodeableConcepts(this.fhirModel.type);
  }

  admitTime() {
    return this._startDate;
  }

  dischargeDisposition() {
    if (this.fhirModel.hospitalization != null &&
        this.fhirModel.hospitalization.dischargeDisposition != null) {
      return core.firstCode(this.fhirModel.hospitalization.dischargeDisposition);
    } else {
      return null;
    }
  }

  admitType() {

  }
}

module.exports = {Encounter: Encounter};
