#!/bin/bash

# ============================================
# QUICK FIX - Run this on EC2 to fix infrastructure pods
# ============================================

set -e

echo "🔧 Quick fix for infrastructure pods..."

# Check current status
echo "📊 Current status:"
kubectl get pods -n infrastructure

# Delete failed pods to force recreate with new configs
echo ""
echo "🗑️  Deleting failed pods..."
kubectl delete pod -n infrastructure -l app=mongodb --force --grace-period=0 || true
kubectl delete pod -n infrastructure -l app=postgres-primary --force --grace-period=0 || true
kubectl delete pod -n infrastructure -l app=rabbitmq --force --grace-period=0 || true
kubectl delete pod -n infrastructure -l app=redis-master --force --grace-period=0 || true
kubectl delete pod -n infrastructure -l app=redis-replica --force --grace-period=0 || true
kubectl delete pod -n infrastructure -l app=redis-sentinel --force --grace-period=0 || true
kubectl delete pod -n infrastructure -l app=pgbouncer --force --grace-period=0 || true

# Restart deployments
echo ""
echo "🔄 Restarting deployments..."
kubectl rollout restart deployment/postgres-depl -n infrastructure || true
kubectl rollout restart deployment/mongodb-depl -n infrastructure || true
kubectl rollout restart deployment/rabbitmq-depl -n infrastructure || true
kubectl rollout restart deployment/redis-depl -n infrastructure || true
kubectl rollout restart deployment/pgbouncer -n infrastructure || true

# Restart StatefulSets
kubectl rollout restart statefulset/postgres-primary -n infrastructure || true
kubectl rollout restart statefulset/redis-master -n infrastructure || true
kubectl rollout restart statefulset/redis-replica -n infrastructure || true
kubectl rollout restart statefulset/redis-sentinel -n infrastructure || true

# Wait for pods to be ready
echo ""
echo "⏳ Waiting for pods to be ready (this may take 2-3 minutes)..."
sleep 30

# Check status again
echo ""
echo "📊 New status:"
kubectl get pods -n infrastructure

echo ""
echo "✅ Quick fix applied! Check pod status above."
echo ""
echo "If still having issues:"
echo "1. Check logs: kubectl logs <pod-name> -n infrastructure"
echo "2. Describe pod: kubectl describe pod <pod-name> -n infrastructure"
echo "3. Check secrets: kubectl get secrets -n infrastructure"
echo "4. Check PVC: kubectl get pvc -n infrastructure"