"use strict";

class CodedValue {
  constructor(code, codeSystemName) {
    this.c = code;
    this.csn = codeSystemName;
  }

  code() {
    return this.c;
  }

  codeSystemName() {
    return this.csn;
  }
}

class Scalar {
  constructor(s) {
    this._unit = s.unit;
    this._value = s.value;
  }

  unit() {
    return this._unit;
  }

  value() {
    return this._value;
  }
}

class CodedEntry {
  setTimestamp(timestamp) {
    this._date = this._startDate = this._endDate = timestamp;
  }

  date() {
    return this._date;
  }

  startDate() {
    return this._startDate;
  }

  endDate() {
    return this._endDate;
  }

  timeStamp() {
    return this._date || this._startDate || this._endDate;
  }

  isTimeRange() {
    return this._startDate && this._endDate;
  }

  isUsable() {
    return this._type.length >0 && (this._date || this._startDate || this._endDate);
  }

  type() {
    return this._type;
  }

  freeTextType() {
    return this._freeTextType;
  }

  status() {
    if(this._statusCode != null) {
      if(this._statusCode['HL7 ActStatus'] != null) {
        return this._statusCode['HL7 ActStatus'][0];
      }
      else if (this._statusCode['SNOMED-CT'] != null) {
        switch(this._statusCode['SNOMED-CT'][0]) {
          case '55561003':
            return 'active';
          case '73425007':
            return 'inactive';
          case '413322009':
            return 'resolved';
        }
      }
    }
  }


  statusCode() {
    return this._statusCode;
  }

  includesCodeFrom(codeSet) {
    for(let codedValue in this._type) {
      if(codedValue.includedIn(codeSet)) {
        return true;
      }
    }
    return false;
  }

  negationInd() {
    return this._negationInd || false;
  }

  values() {
    return this._values;
  }

  negationReason() {
    return this._negationReason;
  }

  reason() {
    return this._reason;
  }

  extractPeriodToStartAndEnd(period) {
    if (period != null) {
      if (period.start != null) {
        this._startDate = period.start.time;
      }
      if (period.end != null) {
        this._endDate = period.end.time;
      }
    }
  }
}

// Unrolls an array of FHIR CodableConcepts
// into an Array of CodedValue. This will
// flatten out multiple CodableConcepts
function unrollCodeableConcepts(ccs) {
  let cvs = [];
  for(let cc in ccs) {
    for(let coding in cc) {
      cvs.push(new CodedValue(coding.code, coding.system));
    }
  }
  return cvs;
}

// Provides the first code of FHIR Codable CodableConcepts
// Will accept null and return null if no code is present
// If there is a code, this function returns a String
function firstCode(cc) {
  if (cc != null) {
    let firstCoding = cc.coding[0];
    if (firstCoding != null) {
      return firstCoding.code;
    }
  }
  return null;
}

// Provides the first code of a FHIR Codable CodableConcepts
// Will accept null and return null if no code is present
// If there is a code, this function returns a CodedValue
function firstCodedValue(cc) {
  if (cc != null) {
    let firstCoding = cc.coding[0];
    if (firstCoding != null) {
      return new CodedValue(firstCoding.code, firstCoding.system);
    }
  }
  return null;
}

module.exports = {CodedValue: CodedValue, CodedEntry: CodedEntry,
  unrollCodeableConcepts: unrollCodeableConcepts, firstCode: firstCode,
  Scalar: Scalar, firstCodedValue: firstCodedValue};
