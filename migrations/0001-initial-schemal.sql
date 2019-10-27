-- Up
create table nullbot_settings (
    guild_id text primary key,
    settings text
);

-- Down
drop table nullbot_settings;
