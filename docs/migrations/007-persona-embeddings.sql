-- Migration: Add vector search for persona content.
-- Replaces keyword-based interests filtering with semantic similarity search
-- over persona interaction_history (posts, comments, references).

-- Step 1: Enable pgvector extension
create extension if not exists vector;

-- Step 2: Create embeddings table (one row per content chunk per persona)
create table persona_embeddings (
  id bigserial primary key,
  persona_id integer not null references personas(id) on delete cascade,
  chunk_text text not null,
  embedding vector(384) not null,
  created_at timestamptz default now()
);

-- Step 3: HNSW index for fast cosine similarity search
create index on persona_embeddings using hnsw (embedding vector_cosine_ops);

-- Step 4: B-tree index for persona_id lookups
create index on persona_embeddings (persona_id);

-- Step 5: RPC function for similarity search
create or replace function match_persona_embeddings(
  query_embedding vector(384),
  match_count int default 20,
  similarity_threshold float default 0.25
)
returns table (
  persona_id integer,
  chunk_text text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    pe.persona_id,
    pe.chunk_text,
    (1 - (pe.embedding <=> query_embedding))::float as similarity
  from persona_embeddings pe
  where (1 - (pe.embedding <=> query_embedding)) > similarity_threshold
  order by pe.embedding <=> query_embedding
  limit match_count;
end;
$$;
