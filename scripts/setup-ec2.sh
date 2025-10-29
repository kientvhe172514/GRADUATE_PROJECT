#!/bin/bash

# ====================================
# EC2 SETUP SCRIPT FOR CI/CD
# ====================================
# This script prepares an EC2 instance for K8s deployment
# Run as: bash setup-ec2.sh
# ====================================

set -e

echo "🚀 Setting up EC2 for CI/CD deployment..."
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Update system
echo "📦 Step 1: Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq
print_status "System updated"
echo ""

# Install basic tools
echo "🔧 Step 2: Installing basic tools..."
sudo apt-get install -y -qq \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    vim \
    wget \
    unzip \
    jq
print_status "Basic tools installed"
echo ""

# Install Docker
echo "🐳 Step 3: Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update -qq
    sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    print_status "Docker installed successfully"
else
    print_warning "Docker already installed"
fi
echo ""

# Install kubectl
echo "☸️ Step 4: Installing kubectl..."
if ! command -v kubectl &> /dev/null; then
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
    rm kubectl
    print_status "kubectl installed successfully"
else
    print_warning "kubectl already installed"
fi
echo ""

# Install k3s
echo "🎯 Step 5: Installing k3s..."
if ! command -v k3s &> /dev/null; then
    curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644
    
    # Wait for k3s to be ready
    echo "⏳ Waiting for k3s to be ready..."
    sleep 10
    sudo k3s kubectl wait --for=condition=Ready node --all --timeout=300s
    print_status "k3s installed and ready"
else
    print_warning "k3s already installed"
fi
echo ""

# Setup kubeconfig
echo "⚙️ Step 6: Setting up kubeconfig..."
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
chmod 600 ~/.kube/config
print_status "kubeconfig configured"
echo ""

# Install skaffold
echo "⚡ Step 7: Installing skaffold..."
if ! command -v skaffold &> /dev/null; then
    curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64
    sudo install skaffold /usr/local/bin/
    rm skaffold
    print_status "skaffold installed successfully"
else
    print_warning "skaffold already installed"
fi
echo ""

# Install Helm (optional but useful)
echo "⎈ Step 8: Installing Helm..."
if ! command -v helm &> /dev/null; then
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    print_status "Helm installed successfully"
else
    print_warning "Helm already installed"
fi
echo ""

# Clone project (if not exists)
echo "📥 Step 9: Setting up project repository..."
PROJECT_DIR="/home/$USER/graduate-project"
if [ ! -d "$PROJECT_DIR" ]; then
    read -p "Enter GitHub repository URL (e.g., https://github.com/username/graduate-project.git): " REPO_URL
    if [ ! -z "$REPO_URL" ]; then
        cd ~
        git clone "$REPO_URL" graduate-project
        cd graduate-project
        print_status "Project repository cloned"
    else
        print_warning "Skipping repository clone. You'll need to clone it manually."
    fi
else
    print_warning "Project directory already exists at $PROJECT_DIR"
    cd "$PROJECT_DIR"
    git pull || print_warning "Could not pull latest changes"
fi
echo ""

# Setup GitHub Container Registry auth
echo "🔐 Step 10: Setting up container registry authentication..."
read -p "Enter your GitHub username (press Enter to skip): " GH_USERNAME
if [ ! -z "$GH_USERNAME" ]; then
    read -sp "Enter your GitHub Personal Access Token (press Enter to skip): " GH_TOKEN
    echo ""
    if [ ! -z "$GH_TOKEN" ]; then
        mkdir -p ~/.docker
        AUTH_STRING=$(echo -n "$GH_USERNAME:$GH_TOKEN" | base64)
        cat > ~/.docker/config.json << EOF
{
  "auths": {
    "ghcr.io": {
      "auth": "$AUTH_STRING"
    }
  }
}
EOF
        print_status "GitHub Container Registry authentication configured"
    else
        print_warning "Skipping GHCR authentication"
    fi
else
    print_warning "Skipping GHCR authentication"
fi
echo ""

# Create necessary namespaces
echo "📦 Step 11: Creating Kubernetes namespaces..."
kubectl create namespace default --dry-run=client -o yaml | kubectl apply -f - 2>/dev/null || true
kubectl create namespace infrastructure --dry-run=client -o yaml | kubectl apply -f - 2>/dev/null || true
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f - 2>/dev/null || true
print_status "Namespaces created"
echo ""

# Setup firewall rules (UFW)
echo "🔥 Step 12: Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp comment 'SSH'
    sudo ufw allow 80/tcp comment 'HTTP'
    sudo ufw allow 443/tcp comment 'HTTPS'
    sudo ufw allow 6443/tcp comment 'K3s API'
    sudo ufw allow 30000:32767/tcp comment 'NodePort Services'
    # Don't enable UFW automatically to avoid locking out
    print_status "Firewall rules configured (not enabled yet)"
    print_warning "To enable firewall, run: sudo ufw enable"
else
    print_warning "UFW not available"
fi
echo ""

# Verify installation
echo ""
echo "=========================================="
echo "📊 Installation Verification"
echo "=========================================="
echo ""
echo "Docker version: $(docker --version)"
echo "Kubectl version: $(kubectl version --client --short 2>/dev/null || kubectl version --client)"
echo "K3s version: $(k3s --version | head -n1)"
echo "Skaffold version: $(skaffold version)"
echo "Helm version: $(helm version --short)"
echo ""

echo "🎯 Kubernetes cluster status:"
kubectl get nodes
echo ""

echo "📦 Namespaces:"
kubectl get namespaces
echo ""

echo "=========================================="
echo "✅ EC2 Setup Complete!"
echo "=========================================="
echo ""
echo "📝 Next Steps:"
echo "   1. Logout and login again for docker group to take effect"
echo "   2. Setup GitHub Secrets in your repository:"
echo "      - AWS_ACCESS_KEY_ID"
echo "      - AWS_SECRET_ACCESS_KEY"
echo "      - EC2_HOST (this instance's public IP/DNS)"
echo "      - EC2_USER ($USER)"
echo "      - EC2_SSH_PRIVATE_KEY"
echo ""
echo "   3. Test the connection:"
echo "      ssh -i your-key.pem $USER@\$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo ""
echo "   4. Deploy infrastructure:"
echo "      cd $PROJECT_DIR"
echo "      kubectl apply -f infra/k8s/platform/"
echo "      kubectl apply -f infra/k8s/shared/"
echo ""
echo "🚀 Your EC2 instance is ready for CI/CD deployments!"
echo ""
