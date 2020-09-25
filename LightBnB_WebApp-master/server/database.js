const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb',
});

const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  const queryString = `
  SELECT *
  FROM users
  WHERE email = $1;`;
  const values = [email];
  let user;

  return pool.query(queryString, values)
    .then(res => res.rows[0]);
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  /***return Promise.resolve(users[id]);***/
  const queryString = `
  SELECT *
  FROM users
  WHERE id = $1;`;
  const values = [id];

  return pool.query(queryString, values)
    .then(res => res.rows[0]);
}
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  /***const userId = Object.keys(users).length + 1;
  user.id = userId;
  users[userId] = user;
  return Promise.resolve(user);***/
  const queryString = `
  INSERT INTO users(name, email, password) 
  VALUES($1, $2, $3) RETURNING *`;
  const values = [user.name, user.email, user.password];

  return pool.query(queryString, values)
    .then(res => res.rows[0]);
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const queryString = `
  SELECT reservations.*, properties.*, avg(property_reviews.rating) AS average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON property_reviews.reservation_id = reservations.id
  WHERE reservations.end_date < now()::date AND reservations.guest_id = $1
  GROUP BY reservations.id, properties.id
  ORDER BY reservations.start_date
  LIMIT $2`;
  const values = [guest_id, limit];

  return pool.query(queryString, values)
    .then(res => res.rows);
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
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) AS average_rating
  FROM properties
  JOIN property_reviews ON property_reviews.property_id = properties.id
  `;
  let values = [];   //Query Parameters given as input by user

  if (options.city) {
    values.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${values.length} `;
  }
  if (options.minimum_price_per_night) {
    values.push(`${options.minimum_price_per_night}`);
    if (values.length === 0) {
      queryString += `WHERE properties.cost_per_night >= $${values.length} `;
    } else {
      queryString += `AND properties.cost_per_night >= $${values.length} `;
    }
  }
  if (options.maximum_price_per_night) {
    values.push(`${options.maximum_price_per_night}`);
    if (values.length === 0) {
      queryString += `WHERE properties.cost_per_night <= $${values.length} `;
    } else {
      queryString += `AND properties.cost_per_night <= $${values.length} `;
    }
  }

  if (options.minimum_rating) {
    values.push(`${options.minimum_rating}`);
    if (values.length === 0) {
      queryString += `WHERE property_reviews.rating >= $${values.length} `;
    } else {
      queryString += `AND property_reviews.rating >= $${values.length} `;
    }
  }

  values.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${values.length};
  `;
  console.log(queryString);
  return pool.query(queryString, values)
    .then(res => res.rows)
    .catch(err => err.stack);
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
