#!/bin/bash

# Setup Local Domains for itellico Mono Multi-Tenant Development
# Created: July 2025

set -e

echo "🌐 Setting up itellico Mono local domains..."

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    echo "⚠️  Please run this script as a regular user (it will prompt for sudo when needed)"
    exit 1
fi

# Create backup of existing hosts file
BACKUP_FILE="/etc/hosts.backup.$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup at $BACKUP_FILE..."
sudo cp /etc/hosts "$BACKUP_FILE"

# Check if domains already exist
if grep -q "mono.local" /etc/hosts; then
    echo "⚠️  Some domains already exist in /etc/hosts"
    echo "Continue anyway? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled"
        exit 1
    fi
fi

# Add itellico Mono domains to /etc/hosts
echo "✅ Adding itellico Mono domains..."

sudo tee -a /etc/hosts << 'EOF'

# =============================================================================
# itellico Mono - Local Development Domains
# =============================================================================

# Platform Management (itellico Mono internal)
127.0.0.1   mono.local
127.0.0.1   app.mono.local
127.0.0.1   api.mono.local
127.0.0.1   docs.mono.local
127.0.0.1   admin.mono.local
127.0.0.1   monitoring.mono.local

# =============================================================================
# Multi-Tenant Examples (Independent Domain Simulation)
# =============================================================================

# Modeling Agency - Go Models
127.0.0.1   go-models.local
127.0.0.1   app.go-models.local
127.0.0.1   api.go-models.local
127.0.0.1   blog.go-models.local

# Fashion Agency
127.0.0.1   fashion-agency.local
127.0.0.1   app.fashion-agency.local
127.0.0.1   api.fashion-agency.local
127.0.0.1   blog.fashion-agency.local

# Pet Models Agency
127.0.0.1   pet-models.local
127.0.0.1   app.pet-models.local
127.0.0.1   api.pet-models.local
127.0.0.1   blog.pet-models.local

# Creative Freelancers Platform
127.0.0.1   creative-freelancers.local
127.0.0.1   app.creative-freelancers.local
127.0.0.1   api.creative-freelancers.local
127.0.0.1   blog.creative-freelancers.local

# Acting Talent Agency
127.0.0.1   talent-hub.local
127.0.0.1   app.talent-hub.local
127.0.0.1   api.talent-hub.local
127.0.0.1   blog.talent-hub.local

# Photography Network
127.0.0.1   photo-network.local
127.0.0.1   app.photo-network.local
127.0.0.1   api.photo-network.local
127.0.0.1   blog.photo-network.local

EOF

echo ""
echo "✅ Local domains configured successfully!"
echo ""
echo "🚀 Available URLs:"
echo ""
echo "📊 itellico Mono Platform Management:"
echo "   - Platform Admin: http://mono.local:3000"
echo "   - Platform App:   http://app.mono.local:3000"
echo "   - Platform API:   http://api.mono.local:3001"
echo "   - API Docs:       http://docs.mono.local:3001"
echo "   - Monitoring:     http://monitoring.mono.local:5005"
echo ""
echo "🏢 Tenant Examples (Multi-Domain Simulation):"
echo "   - Go Models:           http://go-models.local:3000"
echo "   - Go Models App:       http://app.go-models.local:3000"
echo "   - Go Models Blog:      http://blog.go-models.local:3000"
echo ""
echo "   - Fashion Agency:      http://fashion-agency.local:3000"
echo "   - Pet Models:          http://pet-models.local:3000"
echo "   - Creative Freelance:  http://creative-freelancers.local:3000"
echo "   - Talent Hub:          http://talent-hub.local:3000"
echo "   - Photo Network:       http://photo-network.local:3000"
echo ""
echo "📋 Next Steps:"
echo "   1. Start services: ./start-dev.sh"
echo "   2. Test platform:  http://mono.local:3000"
echo "   3. Test tenant:    http://go-models.local:3000"
echo ""
echo "🔧 Troubleshooting:"
echo "   - DNS cache flush: sudo dscacheutil -flushcache"
echo "   - Restore backup:  sudo cp $BACKUP_FILE /etc/hosts"
echo ""
echo "✨ Multi-tenant local development ready!"