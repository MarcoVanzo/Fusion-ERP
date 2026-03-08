const fs = require('fs');

global.window = {
    location: { href: '', hash: '' }
};
global.document = {
    querySelector: () => null,
    getElementById: (id) => ({
        innerHTML: '',
        textContent: '',
        style: {},
        classList: { toggle: ()=>{}, add: ()=>{}, remove: ()=>{} },
        addEventListener: ()=>{}
    }),
    createElement: () => ({
        src: '', setAttribute: ()=>{}, classList: { toggle: ()=>{}, add: ()=>{}, remove: ()=>{} }, addEventListener: ()=>{}
    }),
    head: { appendChild: ()=>{} }
};

global.Utils = {
    qsa: () => [],
    emptyState: () => ''
};
global.UI = {
    skeletonPage: () => '',
    toast: console.log
};
global.App = {
    getUser: () => ({ role: 'admin', permissions: {} }) // passes permissions check
};
global.URLSearchParams = class { entries() { return []; } toString() { return ""; } };

// evaluate router
eval(fs.readFileSync('js/core/router.js', 'utf8'));

global.window.Router = Router;

// evaluate ecommerce
eval(fs.readFileSync('js/modules/ecommerce.js', 'utf8'));

(async () => {
    // Navigate to articles first, as the user would
    await Router.navigate('ecommerce-articles');
    
    // Simulate script load
    global.window.Ecommerce = Ecommerce;
    
    // Now user clicks orders
    await Router.navigate('ecommerce-orders');
    
    console.log("Current Route is:", Router.getCurrentRoute());
    
    // Check what _currentTab evaluated to in ecommerce.js
    // We can just rely on the test_db.php if needed, or modify ecommerce.js temp to expose it
})();
