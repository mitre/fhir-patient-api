"use strict";

let hqmf = require('./hqmf-util.js');

let core = {
  CodedValue: class CodedValue {

    constructor(code, codeSystemName) {
      this.c = code;

      let csMap = {"http://www.ama-assn.org/go/cpt": "CPT",
                   "http://loinc.org": "LOINC",
                   "http://snomed.info/sct": "SNOMED-CT",
                   "http://www.nlm.nih.gov/research/umls/rxnorm/": "RxNorm",
                   "http://hl7.org/fhir/sid/icd-9": "ICD-9-CM",
                   "http://hl7.org/fhir/sid/icd-10": "ICD-10-PCS",
                   "http://www.fda.gov/Drugs/InformationOnDrugs": "NDC",
                   "http://www2a.cdc.gov/vaccines/iis/iisstandards/vaccines.asp?rpt=cvx": "CVX"};
      this.csn = csMap[codeSystemName];
    }

    code() {
      return this.c;
    }

    codeSystemName() {
      return this.csn;
    }

    static normalize(val) {
      return String(val).toLowerCase();
    }

    includedIn(codeSet) {
      var c1, c2, code, codeSystemName, codes, i, len;
      for (codeSystemName in codeSet) {
        codes = codeSet[codeSystemName];
        if (this.csn === codeSystemName) {
          for (i = 0, len = codes.length; i < len; i++) {
            code = codes[i];
            c1 = CodedValue.normalize(code);
            c2 = CodedValue.normalize(this.c);
            if (c1 === c2) {
              return true;
            }
          }
        }
      }
      return false;
    }
  },

  Scalar: class Scalar {
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
  },

  // PhysicalQuantity and Scalar are different objects in the patient-api with
  // ever so small differences in interfaces. We replicate that here.
  PhysicalQuantity: class PhysicalQuantity {
    constructor(pq) {
      this._units = pq.unit;
      this._scalar = pq.value;
    }

    units() {
      return this._units;
    }

    scalar() {
      return this._scalar;
    }
  },

  CodedEntry: class CodedEntry {
    // there is one place in hqmf2js that calls the underlying json structure of the
    // hQuery PatientApi.  This is here to mimic that behavior and prevent exceptions
    // being thrown from the calculation

    get json(){return this.fhirModel;}

    get id(){return this.fhirModel._id;}

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
      return this._status;
    }

    respondTo(functionName) {
      return typeof(this[functionName]) === "function";
    }

    includesCodeFrom(codeSet) {
      for (var i = 0; i < this._type.length; i++) {
        let codedValue = this._type[i];
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

    // Copied from hqmf2js patient-api extensions
    asIVL_TS() {
      var tsHigh, tsLow;
      tsLow = new hqmf.TS();
      tsLow.date = this.startDate() || this.date() || null;
      tsHigh = new hqmf.TS();
      tsHigh.date = this.endDate() || this.date() || null;
      return new hqmf.IVL_TS(tsLow, tsHigh);
    }

    // Copied from hqmf2js patient-api extensions
    asTS() {
      var ts;
      ts = new hqmf.TS();
      ts.date = this.timeStamp();
      return ts;
    }
  },

  // Unrolls an array of FHIR CodableConcepts
  // into an Array of CodedValue. This will
  // flatten out multiple CodableConcepts
  unrollCodeableConcepts: function(ccs) {
    let cvs = new core.CodedEntryList();
    for (var i = 0; i < ccs.length; i++) {
      let cc = ccs[i];
      for (var j = 0; j < cc.coding.length; j++) {
        let coding = cc.coding[j];
        cvs.push(new core.CodedValue(coding.code, coding.system));
      }
    }
    return cvs;
  },

  // Unrolls all of the codings in a single FHIR CodableConcept and creates
  // an Array of CodedValue
  unrollCodeableConcept: function(cc) {
    let cvs = new core.CodedEntryList();
    for (var i = 0; i < cc.coding.length; i++) {
      let coding = cc.coding[i];
      cvs.push(new core.CodedValue(coding.code, coding.system));
    }

    return cvs;
  },

  // Provides the first code of FHIR Codable CodableConcepts
  // Will accept null and return null if no code is present
  // If there is a code, this function returns a String
  firstCode: function(cc) {
    if (cc != null) {
      let firstCoding = cc.coding[0];
      if (firstCoding != null) {
        return firstCoding.code;
      }
    }
    return null;
  },

  // Provides the first code of a FHIR Codable CodableConcepts
  // Will accept null and return null if no code is present
  // If there is a code, this function returns a CodedValue
  firstCodedValue: function(cc) {
    if (cc != null) {
      let firstCoding = cc.coding[0];
      if (firstCoding != null) {
        return new core.CodedValue(firstCoding.code, firstCoding.system);
      }
    }
    return null;
  },

  // Copied from the patient-api by convering the CoffeeScript to JavaScript
  // and then some minor tweaking
  CodedEntryList: class CodedEntryList extends Array {
    constructor() {
      super();
      this.push.apply(this, arguments);
      this.indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) { return i; }} return -1; };
    }

    pushIfUsable(entry) {
      if (entry.isUsable()) {
        return this.push(entry);
      }
    }

    match(codeSet, start, end, includeNegated) {
      var afterStart, beforeEnd, cloned, entry, i, len, matchesCode;
      if (includeNegated == null) {
        includeNegated = false;
      }
      cloned = new CodedEntryList();
      for (i = 0, len = this.length; i < len; i++) {
        entry = this[i];
        afterStart = !start || entry.timeStamp() >= start;
        beforeEnd = !end || entry.timeStamp() <= end;
        matchesCode = codeSet === null || entry.includesCodeFrom(codeSet);
        if (afterStart && beforeEnd && matchesCode && (includeNegated || !entry.negationInd())) {
          cloned.push(entry);
        }
      }
      return cloned;
    }

    concat(otherEntries) {
      var cloned, entry, i, j, len, len1;
      cloned = new CodedEntryList();
      for (i = 0, len = this.length; i < len; i++) {
        entry = this[i];
        cloned.push(entry);
      }
      for (j = 0, len1 = otherEntries.length; j < len1; j++) {
        entry = otherEntries[j];
        cloned.push(entry);
      }
      return cloned;
    }

    withStatuses(statuses, includeUndefined) {
      var cloned, entry, i, len, ref;
      if (includeUndefined == null) {
        includeUndefined = true;
      }
      if (includeUndefined) {
        statuses = statuses.concat([void 0, null]);
      }
      cloned = new CodedEntryList();
      for (i = 0, len = this.length; i < len; i++) {
        entry = this[i];
        if (ref = entry.status(), this.indexOf.call(statuses, ref) >= 0) {
          cloned.push(entry);
        }
      }
      return cloned;
    }

    withNegation(codeSet) {
      var cloned, entry, i, len;
      cloned = new CodedEntryList();
      for (i = 0, len = this.length; i < len; i++) {
        entry = this[i];
        if (entry.negationInd() && (!codeSet || (entry.negationReason() && entry.negationReason().includedIn(codeSet)))) {
          cloned.push(entry);
        }
      }
      return cloned;
    }

    withoutNegation() {
      var cloned, entry, i, len;
      cloned = new CodedEntryList();
      for (i = 0, len = this.length; i < len; i++) {
        entry = this[i];
        if (!entry.negationInd()) {
          cloned.push(entry);
        }
      }
      return cloned;
    }

    isTrue() {
      return this.length !== 0;
    }

    isFalse() {
      return this.length === 0;
    }
  }
};

module.exports = core;
