"use strict";

class CodedValue {
  constructor(code, codeSystemName) {
    this.code = code;
    this.codeSystemName = codeSystemName;
  }

  get code() {
    return this.code;
  }

  get codeSystemName() {
    return this.codeSystemName;
  }
}

module.exports = {CodedValue: CodedValue};
