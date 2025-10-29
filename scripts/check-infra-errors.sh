#!/bin/bash
echo '=== Checking MongoDB ==='
kubectl describe pod -l app=mongodb -n infrastructure | grep -A 10 'Events:'
echo ''
echo '=== Checking PgBouncer ==='
kubectl describe pod -l app=pgbouncer -n infrastructure | grep -A 10 'Events:'
echo ''
echo '=== Checking Postgres Primary ==='
kubectl describe pod postgres-primary-0 -n infrastructure | grep -A 10 'Events:'
echo ''
echo '=== Checking RabbitMQ ==='
kubectl describe pod -l app=rabbitmq -n infrastructure | grep -A 10 'Events:'
echo ''
echo '=== Checking Redis Master ==='
kubectl describe pod redis-master-0 -n infrastructure | grep -A 10 'Events:'
echo ''
echo '=== Checking Secrets ==='
kubectl get secrets -n infrastructure
echo ''
echo '=== Checking ConfigMaps ==='
kubectl get configmap -n infrastructure
echo ''
echo '=== Checking PVC ==='
kubectl get pvc -n infrastructure
