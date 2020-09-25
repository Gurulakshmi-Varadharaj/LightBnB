SELECT city, count(reservations.id) AS total_reservation
FROM properties
JOIN reservations ON properties.id = property_id
GROUP BY city
ORDER BY count(reservations.id) DESC;