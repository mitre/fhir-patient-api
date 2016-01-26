"use strict";

let patient = require('./patient.js');
// This class contains extensions to the patient-api
// that are provided by hqmf2js
class ExtendedPatient extends patient.Patient {
  constructor(db, patientId) {
    super(db, patientId);
  }

  allProblems() {
    return this.conditions();
  }

  allProcedures() {
    return this.procedures().concat(this.immunizations()).concat(this.medications());
  }

  procedureResults() {
    return this.results().concat(this.procedures());
  }

  allMedications() {
    return this.medications();
  }

  laboratoryTests(){
    return this.results();
  }

  allDevices(){
    return this.procedures();
  }

  getAndCacheEvents() {

    var args, fn, key, that;
    key = arguments[0], that = arguments[1], fn = arguments[2], args = 4 <= arguments.length ? slice.call(arguments, 3) : [];
    this.cache || (this.cache = {});
    if (!this.cache[key]) {
      this.cache[key] = fn.apply(that, args);
    }
    return this.cache[key];
  }

  getEvents(eventCriteria) {
    var cacheKey, codes, events;
    cacheKey = eventCriteria.type;
    events = this.getAndCacheEvents(cacheKey, this, this[eventCriteria.type]);
    if (eventCriteria.statuses && eventCriteria.statuses.length > 0) {
      cacheKey = cacheKey + "_" + String(eventCriteria.statuses);
      events = this.getAndCacheEvents(cacheKey, events, events.withStatuses, eventCriteria.statuses, eventCriteria.includeEventsWithoutStatus);
    }
    cacheKey = cacheKey + "_" + String(eventCriteria.negated) + String(eventCriteria.negationValueSetId);
    if (eventCriteria.negated) {
      codes = getCodes(eventCriteria.negationValueSetId);
      events = this.getAndCacheEvents(cacheKey, events, events.withNegation, codes);
    } else {
      events = this.getAndCacheEvents(cacheKey, events, events.withoutNegation);
    }
    if (eventCriteria.valueSetId) {
      cacheKey = cacheKey + "_" + String(eventCriteria.valueSetId) + "_" + String(eventCriteria.start) + "_" + String(eventCriteria.stop);
      codes = getCodes(eventCriteria.valueSetId);
      events = this.getAndCacheEvents(cacheKey, events, events.match, codes, eventCriteria.start, eventCriteria.stop, true);
    } else if (eventCriteria.valueSet) {
      events = events.match(eventCriteria.valueSet, eventCriteria.start, eventCriteria.stop, true);
    }
    events = events.slice(0);
    if (eventCriteria.specificOccurrence) {
      events.specific_occurrence = eventCriteria.specificOccurrence;
    }
    return events;
  }
}

module.exports = {Patient: ExtendedPatient};
