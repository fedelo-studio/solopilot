-- 0007 — Notification rule extensions
--
-- New alert types for project hour-budget thresholds, project deadlines,
-- person capacity, and stale unbilled time. Reuses the existing alerts
-- table/enum-based system entirely — no new table, no new pipeline. The
-- values are added here only; they're first used by a later, separate
-- transaction (recomputeAlerts), which is required for `alter type ... add
-- value` to be safe outside an explicit BEGIN/COMMIT block.

alter type alert_type add value 'project_hours_near_limit';
alter type alert_type add value 'project_hours_exceeded';
alter type alert_type add value 'project_deadline_approaching';
alter type alert_type add value 'person_capacity_exceeded';
alter type alert_type add value 'unbilled_time_stale';
