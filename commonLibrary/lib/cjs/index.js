"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OGIS = exports.subtract = exports.add = void 0;
const add_js_1 = require("./add.js");
Object.defineProperty(exports, "add", { enumerable: true, get: function () { return add_js_1.add; } });
const subtract_js_1 = require("./subtract.js");
Object.defineProperty(exports, "subtract", { enumerable: true, get: function () { return subtract_js_1.subtract; } });
const ollib_js_1 = require("./openlayer/ollib.js");
Object.defineProperty(exports, "OGIS", { enumerable: true, get: function () { return ollib_js_1.OGIS; } });
