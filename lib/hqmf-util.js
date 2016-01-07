// hqmf2js creates a few classes that it uses when it extends the
// patient-api. Since there are parts of the api-extentions which
// need to instantiate these classes, they have been copied there.

// The JavaScript may be rough since the CoffeeScript was
// converted to JavaScript automatically and was then tweaked so
// that it would work in this environment, which meant exporting
// the classes and removing references to hQuery.

var TS,
  slice = [].slice;

TS = (function() {
  function TS(hl7ts, inclusive) {
    var day, hour, minute, month, year;
    this.inclusive = inclusive != null ? inclusive : false;
    if (hl7ts) {
      year = parseInt(hl7ts.substring(0, 4));
      month = parseInt(hl7ts.substring(4, 6), 10) - 1;
      day = parseInt(hl7ts.substring(6, 8), 10);
      hour = parseInt(hl7ts.substring(8, 10), 10);
      if (isNaN(hour)) {
        hour = 0;
      }
      minute = parseInt(hl7ts.substring(10, 12), 10);
      if (isNaN(minute)) {
        minute = 0;
      }
      this.date = new Date(Date.UTC(year, month, day, hour, minute));
    } else {
      this.date = new Date();
    }
  }

  TS.prototype.add = function(pq) {
    if (pq.unit === "a") {
      this.date.setUTCFullYear(this.date.getUTCFullYear() + pq.value);
    } else if (pq.unit === "mo") {
      this.date.setUTCMonth(this.date.getUTCMonth() + pq.value);
    } else if (pq.unit === "wk") {
      this.date.setUTCDate(this.date.getUTCDate() + (7 * pq.value));
    } else if (pq.unit === "d") {
      this.date.setUTCDate(this.date.getUTCDate() + pq.value);
    } else if (pq.unit === "h") {
      this.date.setUTCHours(this.date.getUTCHours() + pq.value);
    } else if (pq.unit === "min") {
      this.date.setUTCMinutes(this.date.getUTCMinutes() + pq.value);
    } else {
      throw new Error("Unknown time unit: " + pq.unit);
    }
    return this;
  };

  TS.prototype.difference = function(ts, granularity) {
    var earlier, later;
    earlier = later = null;
    if (this.afterOrConcurrent(ts)) {
      earlier = ts.asDate();
      later = this.date;
    } else {
      earlier = this.date;
      later = ts.asDate();
    }
    if ((earlier == null) || (later == null)) {
      return Number.MAX_VALUE;
    }
    if (granularity === "a") {
      return TS.yearsDifference(earlier, later);
    } else if (granularity === "mo") {
      return TS.monthsDifference(earlier, later);
    } else if (granularity === "wk") {
      return TS.weeksDifference(earlier, later);
    } else if (granularity === "d") {
      return TS.daysDifference(earlier, later);
    } else if (granularity === "h") {
      return TS.hoursDifference(earlier, later);
    } else if (granularity === "min") {
      return TS.minutesDifference(earlier, later);
    } else {
      throw new Error("Unknown time unit: " + granularity);
    }
  };

  TS.prototype.asDate = function() {
    return this.date;
  };

  TS.prototype.before = function(other) {
    var a, b, ref;
    if (this.date === null || other.date === null) {
      return false;
    }
    if (other.inclusive) {
      return this.beforeOrConcurrent(other);
    } else {
      ref = TS.dropSeconds(this.date, other.date), a = ref[0], b = ref[1];
      return a.getTime() < b.getTime();
    }
  };

  TS.prototype.after = function(other) {
    var a, b, ref;
    if (this.date === null || other.date === null) {
      return false;
    }
    if (other.inclusive) {
      return this.afterOrConcurrent(other);
    } else {
      ref = TS.dropSeconds(this.date, other.date), a = ref[0], b = ref[1];
      return a.getTime() > b.getTime();
    }
  };

  TS.prototype.equals = function(other) {
    return (this.date === null && other.date === null) || (this.date !== null && other.date !== null && this.date.getTime() === other.date.getTime());
  };

  TS.prototype.beforeOrConcurrent = function(other) {
    var a, b, ref;
    if (this.date === null || other.date === null) {
      return false;
    }
    ref = TS.dropSeconds(this.date, other.date), a = ref[0], b = ref[1];
    return a.getTime() <= b.getTime();
  };

  TS.prototype.afterOrConcurrent = function(other) {
    var a, b, ref;
    if (this.date === null || other.date === null) {
      return false;
    }
    ref = TS.dropSeconds(this.date, other.date), a = ref[0], b = ref[1];
    return a.getTime() >= b.getTime();
  };

  TS.prototype.withinSameMinute = function(other) {
    var a, b, ref;
    ref = TS.dropSeconds(this.date, other.date), a = ref[0], b = ref[1];
    return a.getTime() === b.getTime();
  };

  TS.yearsDifference = function(earlier, later) {
    if (later.getUTCMonth() < earlier.getUTCMonth()) {
      return later.getUTCFullYear() - earlier.getUTCFullYear() - 1;
    } else if (later.getUTCMonth() === earlier.getUTCMonth() && later.getUTCDate() >= earlier.getUTCDate()) {
      return later.getUTCFullYear() - earlier.getUTCFullYear();
    } else if (later.getUTCMonth() === earlier.getUTCMonth() && later.getUTCDate() < earlier.getUTCDate()) {
      return later.getUTCFullYear() - earlier.getUTCFullYear() - 1;
    } else {
      return later.getUTCFullYear() - earlier.getUTCFullYear();
    }
  };

  TS.monthsDifference = function(earlier, later) {
    if (later.getUTCDate() >= earlier.getUTCDate()) {
      return (later.getUTCFullYear() - earlier.getUTCFullYear()) * 12 + later.getUTCMonth() - earlier.getUTCMonth();
    } else {
      return (later.getUTCFullYear() - earlier.getUTCFullYear()) * 12 + later.getUTCMonth() - earlier.getUTCMonth() - 1;
    }
  };

  TS.minutesDifference = function(earlier, later) {
    var e, l, ref;
    ref = TS.dropSeconds(earlier, later), e = ref[0], l = ref[1];
    return Math.floor(((l.getTime() - e.getTime()) / 1000) / 60);
  };

  TS.hoursDifference = function(earlier, later) {
    return Math.floor(TS.minutesDifference(earlier, later) / 60);
  };

  TS.daysDifference = function(earlier, later) {
    var e, l;
    e = new Date(Date.UTC(earlier.getUTCFullYear(), earlier.getUTCMonth(), earlier.getUTCDate()));
    l = new Date(Date.UTC(later.getUTCFullYear(), later.getUTCMonth(), later.getUTCDate()));
    return Math.floor(TS.hoursDifference(e, l) / 24);
  };

  TS.weeksDifference = function(earlier, later) {
    return Math.floor(TS.daysDifference(earlier, later) / 7);
  };

  TS.dropSeconds = function() {
    var noSeconds, timeStamp, timeStamps, timeStampsNoSeconds;
    timeStamps = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    timeStampsNoSeconds = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = timeStamps.length; i < len; i++) {
        timeStamp = timeStamps[i];
        noSeconds = new Date(timeStamp.getTime());
        noSeconds.setSeconds(0);
        results.push(noSeconds);
      }
      return results;
    })();
    return timeStampsNoSeconds;
  };

  return TS;

})();

var IVL_TS;

IVL_TS = (function() {
  function IVL_TS(low, high) {
    this.low = low;
    this.high = high;
  }

  IVL_TS.prototype.match = function(other) {
    var ref, ref1;
    if (other == null) {
      return false;
    }
    other = getTS(other, ((ref = this.low) != null ? ref.inclusive : void 0) || ((ref1 = this.high) != null ? ref1.inclusive : void 0));
    if (this.low && this.low.inclusive && this.high && this.high.inclusive) {
      return this.low.equals(other) && this.high.equals(other);
    } else if (this.low) {
      return this.low.before(other);
    } else if (this.high) {
      return this.high.after(other);
    }
  };

  IVL_TS.prototype.add = function(pq) {
    if (this.low) {
      this.low.add(pq);
    }
    if (this.high) {
      this.high.add(pq);
    }
    return this;
  };

  IVL_TS.prototype.DURING = function(other) {
    return this.SDU(other) && this.EDU(other);
  };

  IVL_TS.prototype.OVERLAP = function(other) {
    if (this.high.date === null && other.high.date === null) {
      return true;
    } else if (this.high.date === null) {
      return !this.SAE(other);
    } else if (other.high.date === null) {
      return !this.EBS(other);
    } else {
      return this.SDU(other) || this.EDU(other) || (this.SBS(other) && this.EAE(other));
    }
  };

  IVL_TS.prototype.CONCURRENT = function(other) {
    return this.SCW(other) && this.ECW(other);
  };

  IVL_TS.prototype.SBS = function(other) {
    if (this.low && other.low) {
      return this.low.before(other.low);
    } else {
      return false;
    }
  };

  IVL_TS.prototype.SAS = function(other) {
    if (this.low && other.low) {
      return this.low.after(other.low);
    } else {
      return false;
    }
  };

  IVL_TS.prototype.SBE = function(other) {
    if (this.low && other.high) {
      return this.low.before(other.high);
    } else {
      return false;
    }
  };

  IVL_TS.prototype.SAE = function(other) {
    if (this.low && other.high) {
      return this.low.after(other.high);
    } else {
      return false;
    }
  };

  IVL_TS.prototype.SDU = function(other) {
    if (this.low && other.low && other.high) {
      return this.low.afterOrConcurrent(other.low) && this.low.beforeOrConcurrent(other.high);
    } else {
      return false;
    }
  };

  IVL_TS.prototype.SBDU = function(other) {
    return this.SBS(other) || this.SDU(other);
  };

  IVL_TS.prototype.SCW = function(other) {
    if (this.low && other.low) {
      return this.low.asDate() && other.low.asDate() && this.low.withinSameMinute(other.low);
    } else {
      return false;
    }
  };

  IVL_TS.prototype.SCWE = function(other) {
    if (this.low && other.high) {
      return this.low.asDate() && other.high.asDate() && this.low.withinSameMinute(other.high);
    } else {
      return false;
    }
  };

  IVL_TS.prototype.SBCW = function(other) {
    return this.SBS(other) || this.SCW(other);
  };

  IVL_TS.prototype.SBCWE = function(other) {
    return this.SBE(other) || this.SCWE(other);
  };

  IVL_TS.prototype.SACW = function(other) {
    return this.SAS(other) || this.SCW(other);
  };

  IVL_TS.prototype.SACWE = function(other) {
    return this.SAE(other) || this.SCWE(other);
  };

  IVL_TS.prototype.EBS = function(other) {
    if (this.high && other.low) {
      return this.high.before(other.low);
    } else {
      return false;
    }
  };

  IVL_TS.prototype.EAS = function(other) {
    if (this.high && other.low) {
      return this.high.after(other.low);
    } else {
      return false;
    }
  };

  IVL_TS.prototype.EBE = function(other) {
    if (this.high && other.high) {
      return this.high.before(other.high);
    } else {
      return false;
    }
  };

  IVL_TS.prototype.EAE = function(other) {
    if (this.high && other.high) {
      return this.high.after(other.high);
    } else {
      return false;
    }
  };

  IVL_TS.prototype.EDU = function(other) {
    if (this.high && other.low && other.high) {
      return this.high.afterOrConcurrent(other.low) && this.high.beforeOrConcurrent(other.high);
    } else {
      return false;
    }
  };

  IVL_TS.prototype.ECW = function(other) {
    if (this.high && other.high) {
      return this.high.asDate() && other.high.asDate() && this.high.withinSameMinute(other.high);
    } else {
      return false;
    }
  };

  IVL_TS.prototype.ECWS = function(other) {
    if (this.high && other.low) {
      return this.high.asDate() && other.low.asDate() && this.high.withinSameMinute(other.low);
    } else {
      return false;
    }
  };

  IVL_TS.prototype.EBDU = function(other) {
    return this.EBS(other) || this.EDU(other);
  };

  IVL_TS.prototype.EBCW = function(other) {
    return this.EBE(other) || this.ECW(other);
  };

  IVL_TS.prototype.EACW = function(other) {
    return this.EAE(other) || this.ECW(other);
  };

  IVL_TS.prototype.EBCWS = function(other) {
    return this.EBS(other) || this.ECWS(other);
  };

  IVL_TS.prototype.EACWS = function(other) {
    return this.EAS(other) || this.ECWS(other);
  };

  IVL_TS.prototype.equals = function(other) {
    return ((this.low === null && other.low === null) || (this.low !== null && this.low.equals(other.low))) && ((this.high === null && other.high === null) || (this.high !== null && this.high.equals(other.high)));
  };

  return IVL_TS;

})();

module.exports = {TS: TS, IVL_TS: IVL_TS};
