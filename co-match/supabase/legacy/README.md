# Migraciones antiguas (NO ejecutar)

Estos scripts describen un esquema (`vacancies`, `departments`, `users`, `roles`...)
que **no es el que tiene la base de datos de Supabase del proyecto**.
Se conservan solo como referencia histórica.

El esquema real usa `profiles`, `opportunities`, `applications`, `conversations`,
`messages` y `project_milestones`. Los ajustes vigentes están en
`supabase/migrations/20261108200000_coherencia_esquema_real.sql`.
