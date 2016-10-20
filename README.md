fhir-patient-api
================

This node package provides an alternate method for calculating clinical quality
measures provided with the tools in [popHealth](https://github.com/pophealth/popHealth).

This package provides an implementation of the [patientapi](https://github.com/projecttacoma/patientapi).
The patientapi provides access to the information on a patient when calculating
a clinical quality measure. In the past, this information was stored in a single
JSON document inside of MongoDB. The format of the JSON document was based on
the HITSP C32/Consolidated CDA, however it was a custom format and not a
standard.

This package provides an implementation of the patientapi that is FHIR based. It
assumes that the data will be stored in a JSON format of FHIR resources (with
some minor modifications). Resources are stored in separate MongoDB collections.
The code in this package takes care of loading all of the resources associated
with a patient from different collections so that the clinical quality measure
calculation does not need to concern itself with the underlying implementation.

Change Log
----------

* v0.2.0 (October 20, 2016) - Support for FHIR STU3

License
-------

Copyright 2016 The MITRE Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

		http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
