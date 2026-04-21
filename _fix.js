const fs = require('fs');
const p = 'c:/Users/vijay/Desktop/proStack/frontend/src/components/layout/ClientLayout.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(
  'ml-20 h-screen flex flex-col',
  'ml-0 md:ml-20 h-screen flex flex-col'
);
c = c.replace(
  'px-6 pt-4 pb-6',
  'px-3 pt-3 pb-20 md:px-6 md:pt-4 md:pb-6'
);
fs.writeFileSync(p, c, 'utf8');
console.log('done');
