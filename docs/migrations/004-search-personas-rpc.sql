-- Single-query search using your working pattern: interests::jsonb in EXISTS (no schema change).
-- Same logic as: SELECT * FROM personas i WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(i.interests::jsonb) AS t(elem) WHERE (t.elem->>'name') IN ('nba','soccer'));
CREATE OR REPLACE FUNCTION search_personas(
  p_profession text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_spending_power text DEFAULT NULL,
  p_age_min int DEFAULT NULL,
  p_age_max int DEFAULT NULL,
  p_interest_names text[] DEFAULT NULL,
  p_limit int DEFAULT 5
)
RETURNS TABLE (
  id int,
  reddit_username text,
  age int,
  gender text,
  location text,
  profession text,
  spending_power text
)
LANGUAGE sql
STABLE
AS $$
  SELECT p.id, p.reddit_username, p.age, p.gender, p.location, p.profession, p.spending_power
  FROM personas AS p
  WHERE (p_profession IS NULL OR p.profession = p_profession)
    AND (p_gender IS NULL OR p.gender = p_gender)
    AND (p_location IS NULL OR p.location = p_location)
    AND (p_spending_power IS NULL OR p.spending_power = p_spending_power)
    AND (p_age_min IS NULL OR p.age >= p_age_min)
    AND (p_age_max IS NULL OR p.age <= p_age_max)
    AND (
      p_interest_names IS NULL
      OR array_length(p_interest_names, 1) IS NULL
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p.interests::jsonb) AS t(elem)
        WHERE (t.elem->>'name') IN (SELECT unnest(p_interest_names))
      )
    )
  LIMIT p_limit;
$$;
