"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tweet = void 0;
const mutation_1 = require("./mutation");
const querry_1 = require("./querry");
const resolver_1 = require("./resolver");
const types_1 = require("./types");
exports.Tweet = { types: types_1.types, muatations: mutation_1.muatations, resolvers: resolver_1.resolvers, queries: querry_1.queries };
