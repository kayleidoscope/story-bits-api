CREATE TABLE users (
    id iNTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    username TEXT NOT NULL,
    acct_created TIMESTAMPTZ NOT NULL DEFAULT now()
);