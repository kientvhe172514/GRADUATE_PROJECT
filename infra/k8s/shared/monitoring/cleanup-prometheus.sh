#!/bin/bash
# Script to cleanup Prometheus data when WAL segments are too large
# This will delete all Prometheus data and start fresh

echo "⚠️  WARNING: This will delete all Prometheus metrics data!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo "🗑️  Deleting Prometheus pod..."
kubectl delete pod -l app=prometheus -n monitoring --wait=true

echo "🗑️  Deleting Prometheus PVC (this deletes all stored metrics)..."
kubectl delete pvc prometheus-storage -n monitoring --wait=true

echo "✅ Cleanup complete! Now apply the deployment again:"
echo "   kubectl apply -f infra/k8s/shared/monitoring/prometheus-pvc.yaml"
echo "   kubectl apply -f infra/k8s/shared/monitoring/prometheus-depl.yaml"
echo ""
echo "📊 Prometheus will start fresh with no historical data."
