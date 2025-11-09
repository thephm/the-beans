-- Check for Dark Roast specialty
SELECT st.id, st.name, st.language, s.deprecated, s.id as specialty_id 
FROM specialty_translations st 
JOIN specialties s ON st."specialtyId" = s.id 
WHERE st.name LIKE '%Dark%';

-- Check which roasters have Dark Roast
SELECT r.id, r.name as roaster_name, st.name as specialty_name, s.deprecated
FROM roasters r
JOIN roaster_specialties rs ON r.id = rs."roasterId"
JOIN specialties s ON rs."specialtyId" = s.id
JOIN specialty_translations st ON s.id = st."specialtyId"
WHERE st.name LIKE '%Dark%' AND st.language = 'en';
