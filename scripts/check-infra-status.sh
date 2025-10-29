#!/bin/bash

# ============================================
# INFRASTRUCTURE & SERVICES STATUS CHECK
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print headers
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo ""
print_header "KUBERNETES CLUSTER STATUS"
kubectl cluster-info
echo ""
kubectl get nodes

echo ""
print_header "NAMESPACES"
kubectl get namespaces

echo ""
print_header "INFRASTRUCTURE NAMESPACE"
echo "Pods:"
kubectl get pods -n infrastructure
echo ""
echo "Services:"
kubectl get svc -n infrastructure
echo ""
echo "Secrets:"
kubectl get secrets -n infrastructure

echo ""
print_header "GRADUATE-PROJECT NAMESPACE"
echo "Pods:"
kubectl get pods -n graduate-project
echo ""
echo "Services:"
kubectl get svc -n graduate-project
echo ""
echo "Secrets:"
kubectl get secrets -n graduate-project

echo ""
print_header "MONITORING NAMESPACE"
kubectl get pods -n monitoring 2>/dev/null || print_warning "Monitoring namespace not found or no pods"

echo ""
print_header "PERSISTENT VOLUME CLAIMS"
kubectl get pvc --all-namespaces

echo ""
print_header "INGRESS"
kubectl get ingress --all-namespaces

echo ""
print_header "RECENT EVENTS (Last 10)"
kubectl get events --sort-by=.metadata.creationTimestamp | tail -10

echo ""
print_header "POD HEALTH CHECK"

# Check infrastructure pods
echo "Infrastructure pods status:"
INFRA_PODS=$(kubectl get pods -n infrastructure --no-headers 2>/dev/null | wc -l)
if [ "$INFRA_PODS" -gt 0 ]; then
    kubectl get pods -n infrastructure --no-headers | while read line; do
        POD_NAME=$(echo $line | awk '{print $1}')
        STATUS=$(echo $line | awk '{print $3}')
        READY=$(echo $line | awk '{print $2}')

        case $STATUS in
            "Running")
                print_status "$POD_NAME: $STATUS ($READY)"
                ;;
            "Pending")
                print_warning "$POD_NAME: $STATUS ($READY) - Check PVC or resource constraints"
                ;;
            "CrashLoopBackOff")
                print_error "$POD_NAME: $STATUS ($READY) - Container crashing, check logs"
                ;;
            "ImagePullBackOff")
                print_error "$POD_NAME: $STATUS ($READY) - Cannot pull image from registry"
                ;;
            "CreateContainerConfigError")
                print_error "$POD_NAME: $STATUS ($READY) - Secret/ConfigMap issue"
                ;;
            *)
                print_warning "$POD_NAME: $STATUS ($READY)"
                ;;
        esac
    done
else
    print_warning "No infrastructure pods found"
fi

# Check application pods
echo ""
echo "Application pods status:"
APP_PODS=$(kubectl get pods -n graduate-project --no-headers 2>/dev/null | wc -l)
if [ "$APP_PODS" -gt 0 ]; then
    kubectl get pods -n graduate-project --no-headers | while read line; do
        POD_NAME=$(echo $line | awk '{print $1}')
        STATUS=$(echo $line | awk '{print $3}')
        READY=$(echo $line | awk '{print $2}')

        case $STATUS in
            "Running")
                print_status "$POD_NAME: $STATUS ($READY)"
                ;;
            "Pending")
                print_warning "$POD_NAME: $STATUS ($READY) - Check PVC or resource constraints"
                ;;
            "CrashLoopBackOff")
                print_error "$POD_NAME: $STATUS ($READY) - Container crashing, check logs"
                ;;
            "ImagePullBackOff")
                print_error "$POD_NAME: $STATUS ($READY) - Cannot pull image from registry"
                ;;
            "CreateContainerConfigError")
                print_error "$POD_NAME: $STATUS ($READY) - Secret/ConfigMap issue"
                ;;
            *)
                print_warning "$POD_NAME: $STATUS ($READY)"
                ;;
        esac
    done
else
    print_warning "No application pods found"
fi

echo ""
print_header "QUICK DEBUGGING COMMANDS"
echo "Check pod logs:"
echo "kubectl logs <pod-name> -n <namespace> --tail=50"
echo ""
echo "Describe pod for detailed info:"
echo "kubectl describe pod <pod-name> -n <namespace>"
echo ""
echo "Check events:"
echo "kubectl get events -n <namespace> --sort-by=.metadata.creationTimestamp"
echo ""
echo "Check secrets:"
echo "kubectl get secrets -n <namespace> -o yaml"
echo ""
echo "Check PVC status:"
echo "kubectl describe pvc <pvc-name> -n <namespace>"

echo ""
print_header "DEPLOYMENT SCRIPTS"
echo "If infrastructure failed, run:"
echo "bash scripts/deploy-infrastructure-manual.sh"
echo ""
echo "If services failed, check workflow logs or run manual deployment"