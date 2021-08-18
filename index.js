import pg from 'pg';
const { Client } = pg;

// set the way we will connect to the server
const pgConnectionConfigs = {
  user: 'tail',
  host: 'localhost',
  database: 'cat_owners',
  port: 5432, // Postgres server always runs on this port
};

// create the var we'll use
const client = new Client(pgConnectionConfigs);

// make the connection to the server
client.connect();

// create the query done callback
const whenQueryDone = (error, result) => {
  // this error is anything that goes wrong with the query
  if (error) {
    console.log('error', error);
  } else {
    // rows key has the data
    console.log(result.rows);
  }

  // close the connection
  client.end();
};

// write the SQL query
let sqlQuery;
switch(process.argv[2]) {
  case('create-owner'): {
    console.log("creating owner");
    sqlQuery = `INSERT INTO owners (name) VALUES ('${process.argv[3]}') RETURNING *`;
    client.query(sqlQuery, whenQueryDone);
    break
  }
  // node index.js <OWNER_ID> <CAT_NAME>
  case('create-cat'): {
    console.log("creating cat");
    sqlQuery = `INSERT INTO cats (name, owner_id) VALUES ('${process.argv[3]}', '${process.argv[4]}') RETURNING *`;
    client.query(sqlQuery, whenQueryDone);
    break;
  }
  case('cats'): {
    console.log("Querying all cats");
    sqlQuery = 'SELECT * FROM cats';
    client.query(sqlQuery, (error, result) => {
      result.rows.forEach((cat, index) => {
      const ownerQuery = `SELECT name FROM owners WHERE id=${cat.owner_id}`;
      client.query(ownerQuery, (error, ownerResult) => {
        if (error) throw error;
        console.log(`${cat.id}. ${cat.name}, Owner:${ownerResult.rows[0].name}`);
        if (index === result.rows.length - 1) client.end();
        })
      })
    })
  break;
}
  default:
    console.log("What saying you?");
    client.end();
    break;
}