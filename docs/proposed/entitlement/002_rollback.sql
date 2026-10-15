-- E1 ROLLBACK PROPOSAL. NOT EXECUTED. Removes only what 001_entitlement.sql creates. Touches no legacy table and no other schema.
-- Order matters: functions, trigger function, then tables (events first). Dropping the tables deletes every entitlement row and event.
begin;
drop function if exists public.entitlement_admin(uuid, text, integer, text);
drop function if exists public.entitlement_first_rep_completed();
drop function if exists public.entitlement_get();
drop function if exists public.entitlement_json(public.entitlement);
drop table if exists public.entitlement_event;
drop table if exists public.entitlement;     -- drops the entitlement_guard trigger with it
drop function if exists public.entitlement_guard();
commit;
