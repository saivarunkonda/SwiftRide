#!/bin/bash
# Run once after EKS cluster is up

set -e

echo "Installing ArgoCD..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=available --timeout=120s deployment/argocd-server -n argocd

echo "Applying ride-platform application..."
kubectl apply -f infra/argocd/application.yaml

echo "ArgoCD admin password:"
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

echo "Port-forward ArgoCD UI: kubectl port-forward svc/argocd-server -n argocd 8443:443"
