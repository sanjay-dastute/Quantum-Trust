const kyber = require('crystals-kyber-js');
const inst = new kyber.MlKem768();
console.log('MlKem768 methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(inst)));
