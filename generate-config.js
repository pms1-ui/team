// This script generates config.js from environment variables during build
const fs = require('fs');

const config = `// Baserow API Configuration (Generated from environment variables)
const BASEROW_CONFIG = {
    apiUrl: '${process.env.BASEROW_API_URL || 'https://baserow.childylab.com/api'}',
    token: '${process.env.BASEROW_TOKEN || ''}',
    tables: {
        divisions: ${process.env.TABLE_DIVISIONS || 1940},
        teams: ${process.env.TABLE_TEAMS || 1941},
        members: ${process.env.TABLE_MEMBERS || 1942},
        goals: ${process.env.TABLE_GOALS || 1943},
        keyResults: ${process.env.TABLE_KEY_RESULTS || 1944},
        rnr: ${process.env.TABLE_RNR || 1945},
        poll: ${process.env.TABLE_POLL || 1955}
    }
};
`;

fs.writeFileSync('config.js', config);
console.log('✅ config.js generated from environment variables');
