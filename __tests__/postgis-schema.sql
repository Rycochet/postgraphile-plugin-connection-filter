-- create role graphile_build_test with login superuser password 'some-password';
-- create database graphile_build_test OWNER graphile_build_test;
-- alter role graphile_build_test set search_path to postgis, "$user", public;

drop schema if exists postgis cascade;
drop extension if exists postgis;

create schema postgis;

create extension postgis schema postgis;

create table postgis.filterable (
  id serial primary key,
  the_geom geometry
);
