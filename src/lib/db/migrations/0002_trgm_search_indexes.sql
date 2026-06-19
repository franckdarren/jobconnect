-- Activation de l'extension pg_trgm pour les index GIN sur ILIKE.
-- Sans ça, tout ILIKE '%terme%' avec joker initial = scan séquentiel.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Offres d'emploi : recherche sur titre et description
CREATE INDEX IF NOT EXISTS job_offers_title_trgm_idx
  ON job_offers USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS job_offers_description_trgm_idx
  ON job_offers USING gin (description gin_trgm_ops);

-- Candidats : recherche sur prénom, nom, profession et résumé
CREATE INDEX IF NOT EXISTS candidate_profiles_firstname_trgm_idx
  ON candidate_profiles USING gin (first_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS candidate_profiles_lastname_trgm_idx
  ON candidate_profiles USING gin (last_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS candidate_profiles_profession_trgm_idx
  ON candidate_profiles USING gin (profession gin_trgm_ops);

CREATE INDEX IF NOT EXISTS candidate_profiles_summary_trgm_idx
  ON candidate_profiles USING gin (summary gin_trgm_ops);
