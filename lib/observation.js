"use strict";

let core = require('./core.js');

// This class will be used to represent hQuery.Result
class Observation extends core.CodedEntry {
  constructor(fhirModel) {
    super();
    this.fhirModel = fhirModel;
    this._type = core.unrollCodeableConcepts(fhirModel.code);
    if (this.fhirModel.effectiveDateTime != null) {
      this._date = this.fhirModel.effectiveDateTime.time;
    } else {
      this.extractPeriodToStartAndEnd(this.fhirModel.effectivePeriod);
    }
  }

  // This returns an Array of results because this is the way that the
  // patient-api works. However, it does not seem possible to have more than
  // one value based on the structure of Observation in FHIR
  values() {
    if (this.fhirModel.valueQuantity != null) {
      return [new core.PhysicalQuantity(this.fhirModel.valueQuantity)];
    }
    if (this.fhirModel.valueCodeableConcept != null) {
      return core.unrollCodableConcept(this.fhirModel.valueCodeableConcept);
    }

    return null;
  }
}

module.exports = {Observation: Observation};
