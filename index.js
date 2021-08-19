/*
|\---/|    /\_/\       /\_/\
| o_o |   ( o.o )     ( o o )
 \_^_/     > ^ <       \_^_/
*/   
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
    const output = {}
    result.rows.forEach((row, index) => {
      if (output[row.owner]) {
        output[row.owner].push(row.cat)
      }
      else {
        output[row.owner] = [row.cat];
      }
    })
    console.table(result.rows);
    console.log(output);

  }
  // close the connection
  client.end();
};


const [, , operation, ...args] = process.argv;

// write the SQL query
let sqlQuery;
switch(operation) {
  case('create-owner'): {
    console.log("creating owner", args);
    sqlQuery = `INSERT INTO owners (name) VALUES ('${args}') RETURNING *`;
    client.query(sqlQuery, whenQueryDone);
    break;
  }
  // node index.js <OWNER_ID> <CAT_NAME>
  case('create-cat'): {
    console.log("creating cat", args);
    sqlQuery = `INSERT INTO cats (name, owner_id)
                  VALUES ($2, 
                    (SELECT id FROM owners WHERE name=$1))
                RETURNING *`;
    client.query(sqlQuery, args, whenQueryDone);
    break;
  }
  case('cats'): {
    console.log("Querying all cats");
    sqlQuery = 'SELECT * FROM cats';
    client.query(sqlQuery, (error, result) => {
      console.table(result.rows);
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
  case('owners'): {
    console.log("Querying all owners");
    if (args.length === 0) {
      sqlQuery = `SELECT owners.name as Owner, cats.name as Cat
                      FROM owners
                      INNER JOIN cats
                      ON owners.id = cats.owner_id;`
      client.query(sqlQuery, whenQueryDone);
    }
    else {
      console.log('args[0] :>> ', args[0]);
      console.log(Number.isNaN(Number(args[0])));
      if (Number.isNaN(Number(args[0]))) {
        sqlQuery = `SELECT name FROM owners WHERE id IN
        (SELECT owner_id from cats GROUP BY owner_id HAVING COUNT(owner_id) ${args[0]});`
      }
      else {
        sqlQuery = `SELECT name FROM owners WHERE id IN 
        (SELECT owner_id from cats GROUP BY owner_id HAVING COUNT(owner_id) = ${args[0]});`
      }
      client.query(sqlQuery, whenQueryDone);
    }
    break;
}
  case('other-cats'): {
    sqlQuery = `SELECT name FROM cats
                  WHERE owner_id =
                    (SELECT owner_id FROM cats
                      WHERE name='${args[0]}')`;
    client.query(sqlQuery, whenQueryDone);
    break;
  }
  default:
    console.log("What saying you?");
    client.end();
    break;
}