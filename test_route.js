// Mock DOM
global.window = { location: { hash: '' } };
global.document = {
    getElementById: (id) => ({ textContent: '', style: {}, classList: { toggle: ()=>{} }, addEventListener: ()=>{} }),
    createElement: () => ({ setAttribute: ()=>{}, classList: { toggle: ()=>{} }, addEventListener: ()=>{} }),
    querySelectorAll: () => []
};

// Mock Router
global.Router = {
    _route: '',
    getCurrentRoute() { return this._route; },
    navigate(r) { this._route = r; console.log("ROUTER SET TO:", r); }
};
global.window.Router = global.Router;

// Load module
const fs = require('fs');
eval(fs.readFileSync('js/modules/ecommerce.js', 'utf8'));

// Test
(async () => {
    global.Router.navigate('ecommerce-orders');
    await global.Ecommerce.init();
})();
