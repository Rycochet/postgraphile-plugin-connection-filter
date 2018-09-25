-- create role graphile_build_test with login superuser password 'some-password';
-- create database graphile_build_test OWNER graphile_build_test;

drop schema if exists postgis cascade;
drop extension if exists postgis;

create schema postgis;

create extension postgis schema postgis;
set search_path TO postgis, "$user", public;

create table postgis.filterable (
  id serial primary key,
  the_geom geometry
);
