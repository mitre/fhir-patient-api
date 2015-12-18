"use strict";

let core = require('./core.js');

class Medication extends core.CodedEntry {
  constructor(fhirModel) {
    super();
    this.fhirModel = fhirModel;
    this.extractPeriodToStartAndEnd(this.fhirModel.effectivePeriod);
    if (this.fhirModel.medicationCodeableConcept != null) {
      this._type = core.unrollCodeableConcepts(this.fhirModel.medicationCodeableConcept);
    }
  }

  indicateMedicationStart() {
    return this.startDate();
  }

  indicateMedicationStop() {
    return this.endDate();
  }

  route() {
    if (this.fhirModel.dose != null) {
      return core.firstCode(this.fhirModel.dose.route);
    } else {
      return null;
    }
  }

  dose() {
    if (this.fhirModel.dose != null && this.fhirModel.dose.quantityQuantity) {
      return new core.Scalar(this.fhirModel.dose.quantityQuantity);
    } else {
      return null;
    }
  }
}

module.exports = {Medication: Medication};
