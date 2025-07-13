#!/bin/bash

# Mono Local Domain Setup Strategy
# Creates a comprehensive local domain ecosystem for the Mono platform

set -e

echo "🏗️ Mono Local Domain Setup Strategy"
echo "===================================="
echo ""

# Function to add domain to /etc/hosts if it doesn't exist
add_domain() {
    local domain="$1"
    local comment="$2"
    
    if ! grep -q "$domain" /etc/hosts; then
        echo "  ➕ Adding: $domain"
        echo "127.0.0.1	$domain	# $comment" | sudo tee -a /etc/hosts > /dev/null
    else
        echo "  ✅ Exists: $domain"
    fi
}

echo "📋 PROPOSED MONO DOMAIN STRATEGY"
echo "================================"
echo ""
echo "Option 1: .mono Top-Level Domain (Recommended)"
echo "----------------------------------------------"
echo "🎯 Core Platform:"
echo "   • mono.mono           - Main platform landing"
echo "   • app.mono            - Platform admin interface"
echo "   • api.mono            - API endpoints"
echo "   • cdn.mono            - Static assets"
echo ""
echo "🛠️ Development Tools:"
echo "   • grafana.mono        - Monitoring dashboards"
echo "   • prometheus.mono     - Metrics collection"
echo "   • mailpit.mono        - Email testing"
echo "   • n8n.mono            - Workflow automation"
echo "   • temporal.mono       - Workflow engine"
echo "   • redis.mono          - Database GUI"
echo ""
echo "🏢 Multi-Tenant Examples:"
echo "   • tenant1.mono        - Example tenant 1"
echo "   • models.mono         - Go Models tenant"
echo "   • fashion.mono        - Fashion Agency tenant"
echo ""
echo "Option 2: .local Subdomains (Alternative)"
echo "-----------------------------------------"
echo "🎯 Core Platform:"
echo "   • mono.local          - Main platform"
echo "   • mono-app.local      - Admin interface"
echo "   • mono-api.local      - API endpoints"
echo ""
echo "🛠️ Development Tools:"
echo "   • mono-grafana.local  - Monitoring"
echo "   • mono-mail.local     - Email testing"
echo ""

read -p "Which option do you prefer? (1 for .mono, 2 for .local): " OPTION

if [ "$OPTION" = "1" ]; then
    echo ""
    echo "🚀 Setting up .mono domain ecosystem..."
    echo "======================================"
    
    # Core Platform Domains
    echo ""
    echo "📱 Adding Core Platform domains:"
    add_domain "mono.mono" "Mono Platform Main"
    add_domain "app.mono" "Mono Platform Admin"
    add_domain "api.mono" "Mono Platform API"
    add_domain "cdn.mono" "Mono Platform CDN"
    add_domain "auth.mono" "Mono Platform Auth"
    
    # Development Tools
    echo ""
    echo "🛠️ Adding Development Tool domains:"
    add_domain "grafana.mono" "Mono Grafana Dashboard"
    add_domain "prometheus.mono" "Mono Prometheus Metrics"
    add_domain "mailpit.mono" "Mono Email Testing"
    add_domain "n8n.mono" "Mono Workflow Automation"
    add_domain "temporal.mono" "Mono Temporal Engine"
    add_domain "redis.mono" "Mono Redis GUI"
    add_domain "metrics.mono" "Mono Container Metrics"
    
    # Multi-Tenant Examples
    echo ""
    echo "🏢 Adding Multi-Tenant example domains:"
    add_domain "models.mono" "Go Models Tenant"
    add_domain "fashion.mono" "Fashion Agency Tenant"
    add_domain "demo.mono" "Demo Tenant"
    
    DOMAIN_SUFFIX=".mono"
    
elif [ "$OPTION" = "2" ]; then
    echo ""
    echo "🚀 Setting up .local subdomain ecosystem..."
    echo "=========================================="
    
    # Core Platform Domains
    echo ""
    echo "📱 Adding Core Platform domains:"
    add_domain "mono.local" "Mono Platform Main"
    add_domain "mono-app.local" "Mono Platform Admin"
    add_domain "mono-api.local" "Mono Platform API"
    add_domain "mono-cdn.local" "Mono Platform CDN"
    
    # Development Tools
    echo ""
    echo "🛠️ Adding Development Tool domains:"
    add_domain "mono-grafana.local" "Mono Grafana Dashboard"
    add_domain "mono-prometheus.local" "Mono Prometheus Metrics"
    add_domain "mono-mail.local" "Mono Email Testing"
    add_domain "mono-n8n.local" "Mono Workflow Automation"
    add_domain "mono-temporal.local" "Mono Temporal Engine"
    add_domain "mono-redis.local" "Mono Redis GUI"
    
    # Multi-Tenant Examples
    echo ""
    echo "🏢 Adding Multi-Tenant example domains:"
    add_domain "models.local" "Go Models Tenant"
    add_domain "fashion.local" "Fashion Agency Tenant"
    
    DOMAIN_SUFFIX=".local"
    
else
    echo "❌ Invalid option. Please run the script again and choose 1 or 2."
    exit 1
fi

echo ""
echo "✅ Mono domain ecosystem setup complete!"
echo ""
echo "🔧 NEXT STEPS:"
echo "============="
echo ""
echo "1. Update your .env.local file with new domains:"
if [ "$OPTION" = "1" ]; then
    echo "   NEXTAUTH_URL=\"http://app.mono:3000\""
    echo "   NEXT_PUBLIC_API_URL=\"http://api.mono:3001\""
    echo "   GRAFANA_URL=\"http://grafana.mono:5005\""
    echo "   N8N_BASE_URL=\"http://n8n.mono:5678\""
else
    echo "   NEXTAUTH_URL=\"http://mono.local:3000\""
    echo "   NEXT_PUBLIC_API_URL=\"http://mono-api.local:3001\""
    echo "   GRAFANA_URL=\"http://mono-grafana.local:5005\""
    echo "   N8N_BASE_URL=\"http://mono-n8n.local:5678\""
fi
echo ""
echo "2. Configure reverse proxy (optional):"
echo "   • Use nginx or Caddy to route domains to correct ports"
echo "   • Allows removing port numbers from URLs"
echo ""
echo "3. Update Next.js middleware for domain routing:"
echo "   • Enable tenant detection from subdomain"
echo "   • Route requests based on domain patterns"
echo ""
echo "4. Test your new domains:"
if [ "$OPTION" = "1" ]; then
    echo "   • http://app.mono:3000 (Frontend)"
    echo "   • http://api.mono:3001 (API)"
    echo "   • http://grafana.mono:5005 (Monitoring)"
else
    echo "   • http://mono.local:3000 (Frontend)"
    echo "   • http://mono-api.local:3001 (API)"
    echo "   • http://mono-grafana.local:5005 (Monitoring)"
fi
echo ""
echo "🎯 BENEFITS OF THIS SETUP:"
echo "=========================="
echo "✅ Professional local development environment"
echo "✅ Multi-tenant domain testing"
echo "✅ Realistic production-like URLs"
echo "✅ Easy service identification"
echo "✅ Tenant isolation testing"
echo "✅ Clean, memorable domain names"
echo ""
echo "🌟 Your Mono ecosystem is ready for professional development!"