// const properties = require('./json/properties.json');
// const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
// const getUserWithEmail = function(email) {
//   let user;
//   for (const userId in users) {
//     user = users[userId];
//     if (user.email.toLowerCase() === email.toLowerCase()) {
//       break;
//     } else {
//       user = null;
//     }
//   }
//   return Promise.resolve(user);
// }
const getUserWithEmail = function (email) {
  const sql = `SELECT * FROM users WHERE email = $1`;
  return pool.query(sql, [email])
    .then(result => {
      if (result.rows.length) {
        return result.rows[0];
      }
      return null;
    })
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
// const getUserWithId = function(id) {
//   return Promise.resolve(users[id]);
// }
const getUserWithId = function (id) {
  const sql = `SELECT id, name FROM users WHERE id = $1`;
  return pool.query(sql, [id])
    .then(result => {
      if (result.rows.length) {
        return result.rows[0]
      }
      return null;
    })

}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
// const addUser = function (user) {
//   const userId = Object.keys(users).length + 1;
//   user.id = userId;
//   users[userId] = user;
//   return Promise.resolve(user);
// }

const addUser = function (user) {
  const sql = `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`
  const values = [user.name, user.email, user.password]
  return pool.query(sql, values)
    .then(result => {
      return result.rows[0]
    })
    .catch(err => { console.log(err.message) })

}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
// const getAllReservations = function (guest_id, limit = 10) {
//   return getAllProperties(null, 2);
// }
const getAllReservations = function (guest_id, limit = 10) {
  console.log('getAllReservations is called')
  const sql = `SELECT * FROM reservations JOIN properties ON property_id = properties.id WHERE guest_id = $1 LIMIT $2`
  const values = [guest_id, limit]
  return pool.query(sql, values)
  .then(result => {
    console.log('reservations: ', result.rows)
    if(result.rows.length) {
      return result.rows
    }
    return null;
  })
  .catch(err => {console.log(err.message)})
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

 const getAllProperties = function (options, limit = 10) {
  
  const queryParams = [];
  
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  WHERE 1=1 `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `AND LOWER(city) LIKE LOWER($${queryParams.length}) `;
  }

  if (options.owner_id){
    queryParams.push(options.owner_id);
    queryString += `AND owner_id = $${queryParams.length} `
  }

  if(options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    queryString += `AND cost_per_night > $${queryParams.length} `;
  }

  if(options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += `AND cost_per_night < $${queryParams.length} `;
  }

  queryString += `GROUP BY properties.id`

  if(options.minimum_rating) {
  queryParams.push(options.minimum_rating);
  queryString += ` HAVING avg(property_reviews.rating) > $${queryParams.length} `;
  }
  
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
  

  
  console.log('queryString: ',queryString, 'queryParams:', queryParams);

  
  return pool.query(queryString, queryParams).then((res) => res.rows);
};

// const getAllProperties = (options, limit = 10) => {
//   return pool
//     .query(`SELECT * FROM properties LIMIT $1`, [limit])
//     .then((result) => {
//       if (result.rows) {
//         return result.rows;
//       }
//       return null;
//     })
//     .catch((err) => {
//       console.log(err.message);
//     });
// };

// const limitedProperties = {};
// for (let i = 1; i <= limit; i++) {
//   limitedProperties[i] = properties[i];
// }
// return Promise.resolve(limitedProperties);

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
// const addProperty = function (property) {
//   const propertyId = Object.keys(properties).length + 1;
//   property.id = propertyId;
//   properties[propertyId] = property;
//   return Promise.resolve(property);
// }

const addProperty = function (property) {
  
  console.log('property: ', property)
  
  const sql = `INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;`
 
  const values = [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms]

 return pool.query(sql, values)
  .then(result => {
    console.log('result: ', result.rows)
    return result.rows
  })
  .catch(err => { console.log(err.message) })
}
exports.addProperty = addProperty;
