'use strict';
const {renderMathematics}=require('@amachino/leaf-reader/engine');
const legacy=require('./legacy-math-adapter.cjs');
module.exports=(document,article,paper)=>renderMathematics(document,article,paper,{legacyAdapter:legacy.lookup});
