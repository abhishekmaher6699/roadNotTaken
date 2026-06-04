const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.iwupmpgbbvjwcszaymgk:FbAGlRE9xQ7QoVWM@aws-1-ap-south-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function test() {
  const client = await pool.connect();
  try {
    const term = 'gate';
    const queryTerm = '%gate%';
    const centerLng = 72.8347; // Mumbai Lng
    const centerLat = 18.9220; // Mumbai Lat
    
    const res = await client.query(`
      SELECT 
        title,
        ST_Distance(geom, ST_MakePoint($3, $4)::geography) / 1000.0 as distance_km,
        
        -- Exact/phrase match
        (CASE
          WHEN LOWER(title) = LOWER($1) THEN 12.0
          WHEN LOWER(title) LIKE LOWER($2) THEN 8.0
          ELSE 0
        END) as phrase_match_score,

        -- Query-word coverage
        (COALESCE((
          SELECT AVG(
            CASE
              WHEN EXISTS (
                SELECT 1
                FROM unnest(string_to_array(LOWER(CONCAT_WS(' ', title, address, category)), ' ')) AS document_words(document_word)
                WHERE document_word = LOWER(qword)
                  OR document_word LIKE LOWER(qword) || '%'
                  OR similarity(document_word, LOWER(qword)) >= 0.72
              ) THEN 1.0
              ELSE 0.0
            END
          )
          FROM unnest(string_to_array(LOWER($1), ' ')) AS qword
          WHERE LENGTH(qword) >= 3
        ), 0) * 5.0) as word_coverage_score,

        -- Position-independent word match with prefix bonus
        (COALESCE((
          SELECT MAX(
            CASE
              WHEN word = LOWER($1) THEN 1.0
              WHEN word LIKE LOWER($1) || '%' THEN 0.8
              ELSE similarity(LOWER($1), word)
            END
          )
          FROM unnest(string_to_array(LOWER(title), ' ')) AS word
          WHERE LENGTH(word) >= LENGTH($1) - 1
        ), 0) * 3.0) as word_similarity_score,

        -- Distance score
        (LEAST(1.0, EXP(-ST_Distance(geom, ST_MakePoint($3, $4)::geography) / 8000.0)) * 3.0) as distance_score_contrib,

        -- Popularity
        (LOG(GREATEST(score, 0) + 1) * 0.05) as pop_score

      FROM pins
      WHERE status != 'deleted'
        AND (title ILIKE $2 OR title ILIKE '%gateway%')
    `, [term, queryTerm, centerLng, centerLat]);

    console.log(JSON.stringify(res.rows.map(r => ({
      title: r.title,
      distance_km: Math.round(r.distance_km),
      phrase: parseFloat(r.phrase_match_score),
      coverage: parseFloat(r.word_coverage_score),
      similarity: parseFloat(r.word_similarity_score),
      distance_contrib: parseFloat(r.distance_score_contrib),
      popularity: parseFloat(r.pop_score),
      total_relevance: parseFloat(r.phrase_match_score) + parseFloat(r.word_coverage_score) + parseFloat(r.word_similarity_score) + parseFloat(r.distance_score_contrib) + parseFloat(r.pop_score)
    })), null, 2));

  } finally {
    client.release();
    await pool.end();
  }
}

test().catch(console.error);
