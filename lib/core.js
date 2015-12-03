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
}

module.exports = {CodedValue: CodedValue, CodedEntry: CodedEntry};
