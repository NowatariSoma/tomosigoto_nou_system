drop trigger if exists "update_departments_updated_at" on "public"."departments";

drop trigger if exists "update_user_profiles_updated_at" on "public"."user_profiles";

drop trigger if exists "update_user_roles_updated_at" on "public"."user_roles";

revoke delete on table "public"."departments" from "anon";

revoke insert on table "public"."departments" from "anon";

revoke references on table "public"."departments" from "anon";

revoke select on table "public"."departments" from "anon";

revoke trigger on table "public"."departments" from "anon";

revoke truncate on table "public"."departments" from "anon";

revoke update on table "public"."departments" from "anon";

revoke delete on table "public"."departments" from "authenticated";

revoke insert on table "public"."departments" from "authenticated";

revoke references on table "public"."departments" from "authenticated";

revoke select on table "public"."departments" from "authenticated";

revoke trigger on table "public"."departments" from "authenticated";

revoke truncate on table "public"."departments" from "authenticated";

revoke update on table "public"."departments" from "authenticated";

revoke delete on table "public"."departments" from "service_role";

revoke insert on table "public"."departments" from "service_role";

revoke references on table "public"."departments" from "service_role";

revoke select on table "public"."departments" from "service_role";

revoke trigger on table "public"."departments" from "service_role";

revoke truncate on table "public"."departments" from "service_role";

revoke update on table "public"."departments" from "service_role";

revoke delete on table "public"."user_profiles" from "anon";

revoke insert on table "public"."user_profiles" from "anon";

revoke references on table "public"."user_profiles" from "anon";

revoke select on table "public"."user_profiles" from "anon";

revoke trigger on table "public"."user_profiles" from "anon";

revoke truncate on table "public"."user_profiles" from "anon";

revoke update on table "public"."user_profiles" from "anon";

revoke delete on table "public"."user_profiles" from "authenticated";

revoke insert on table "public"."user_profiles" from "authenticated";

revoke references on table "public"."user_profiles" from "authenticated";

revoke select on table "public"."user_profiles" from "authenticated";

revoke trigger on table "public"."user_profiles" from "authenticated";

revoke truncate on table "public"."user_profiles" from "authenticated";

revoke update on table "public"."user_profiles" from "authenticated";

revoke delete on table "public"."user_profiles" from "service_role";

revoke insert on table "public"."user_profiles" from "service_role";

revoke references on table "public"."user_profiles" from "service_role";

revoke select on table "public"."user_profiles" from "service_role";

revoke trigger on table "public"."user_profiles" from "service_role";

revoke truncate on table "public"."user_profiles" from "service_role";

revoke update on table "public"."user_profiles" from "service_role";

revoke delete on table "public"."user_roles" from "anon";

revoke insert on table "public"."user_roles" from "anon";

revoke references on table "public"."user_roles" from "anon";

revoke select on table "public"."user_roles" from "anon";

revoke trigger on table "public"."user_roles" from "anon";

revoke truncate on table "public"."user_roles" from "anon";

revoke update on table "public"."user_roles" from "anon";

revoke delete on table "public"."user_roles" from "authenticated";

revoke insert on table "public"."user_roles" from "authenticated";

revoke references on table "public"."user_roles" from "authenticated";

revoke select on table "public"."user_roles" from "authenticated";

revoke trigger on table "public"."user_roles" from "authenticated";

revoke truncate on table "public"."user_roles" from "authenticated";

revoke update on table "public"."user_roles" from "authenticated";

revoke delete on table "public"."user_roles" from "service_role";

revoke insert on table "public"."user_roles" from "service_role";

revoke references on table "public"."user_roles" from "service_role";

revoke select on table "public"."user_roles" from "service_role";

revoke trigger on table "public"."user_roles" from "service_role";

revoke truncate on table "public"."user_roles" from "service_role";

revoke update on table "public"."user_roles" from "service_role";

revoke delete on table "public"."users" from "anon";

revoke insert on table "public"."users" from "anon";

revoke references on table "public"."users" from "anon";

revoke select on table "public"."users" from "anon";

revoke trigger on table "public"."users" from "anon";

revoke truncate on table "public"."users" from "anon";

revoke update on table "public"."users" from "anon";

revoke delete on table "public"."users" from "authenticated";

revoke insert on table "public"."users" from "authenticated";

revoke references on table "public"."users" from "authenticated";

revoke select on table "public"."users" from "authenticated";

revoke trigger on table "public"."users" from "authenticated";

revoke truncate on table "public"."users" from "authenticated";

revoke update on table "public"."users" from "authenticated";

revoke delete on table "public"."users" from "service_role";

revoke insert on table "public"."users" from "service_role";

revoke references on table "public"."users" from "service_role";

revoke select on table "public"."users" from "service_role";

revoke trigger on table "public"."users" from "service_role";

revoke truncate on table "public"."users" from "service_role";

revoke update on table "public"."users" from "service_role";

alter table "public"."departments" drop constraint "departments_department_code_key";

alter table "public"."user_profiles" drop constraint "user_profiles_department_id_fkey";

alter table "public"."user_profiles" drop constraint "user_profiles_student_id_key";

alter table "public"."user_profiles" drop constraint "user_profiles_user_id_fkey";

alter table "public"."user_roles" drop constraint "user_roles_user_id_fkey";

drop function if exists "public"."update_updated_at_column"();

alter table "public"."departments" drop constraint "departments_pkey";

alter table "public"."user_profiles" drop constraint "user_profiles_pkey";

alter table "public"."user_roles" drop constraint "user_roles_pkey";

alter table "public"."users" drop constraint "users_pkey";

drop index if exists "public"."departments_department_code_key";

drop index if exists "public"."departments_pkey";

drop index if exists "public"."user_profiles_pkey";

drop index if exists "public"."user_profiles_student_id_key";

drop index if exists "public"."user_roles_pkey";

drop index if exists "public"."users_pkey";

drop table "public"."departments";

drop table "public"."user_profiles";

drop table "public"."user_roles";

drop table "public"."users";


