const https = require('https');

https.get('https://wandbox.org/api/list.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const list = JSON.parse(data);
    const compilers = list.map(c => c.name);
    console.log("TS:", compilers.filter(c => c.includes('typescript')).slice(-2));
    console.log("PY:", compilers.filter(c => c.includes('cpython')).slice(-2));
    console.log("C++:", compilers.filter(c => c.includes('gcc')).slice(-3));
    console.log("JS:", compilers.filter(c => c.includes('nodejs')).slice(-2));
  });
}).on('error', err => console.log('Error: ', err.message));
