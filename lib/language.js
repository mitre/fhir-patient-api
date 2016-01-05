"use strict";

let core = require('./core.js');

// This class will be used to represent hQuery.Result
class Language extends core.CodedEntry {
  constructor(fhirModel) {
    super();
    this._type = core.unrollCodableConcept(fhirModel.language);
  }

  preferenceIndicator() {
    return this.fhirModel.preferred;
  }
}

module.exports = {Language: Language};
