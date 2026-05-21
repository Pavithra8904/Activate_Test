const sql = require('mssql/msnodesqlv8');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = `
Driver={ODBC Driver 17 for SQL Server};
Server=${process.env.DB_HOST};
Database=${process.env.DB_NAME};
Trusted_Connection=Yes;
`;

const config = {
  connectionString,

  options: {
    trustedConnection: true,
    trustServerCertificate: true,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log('SQL Connected Successfully');
    return pool;
  })
  .catch((err) => {
    console.log('SQL Connection Failed');
    console.log(JSON.stringify(err, null, 2));
  });

module.exports = {
  sql,
  poolPromise,
};
