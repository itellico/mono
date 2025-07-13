#!/bin/bash

echo "🚀 itellico Mono - Complete Monitoring Status"
echo "=============================================="

echo ""
echo "📊 Prometheus Monitored Services:"
curl -s "http://localhost:9090/api/v1/query?query=up" | jq -r '.data.result[] | if .value[1] == "1" then "\(.metric.job): ✅ UP" else "\(.metric.job): ❌ DOWN" end'

echo ""
echo "🎯 Grafana Dashboards Available:"
echo "• 🚀 Mono Platform - Unified Overview v2 (Homepage)"
echo "• ⚡ Temporal Server Monitoring"
echo "• 🔥 Fastify API Metrics" 
echo "• 🗄️ PostgreSQL Metrics"
echo "• 🔴 Redis Metrics"

echo ""
echo "🔍 Manual Service Health Checks:"
echo -n "• Temporal Web UI: "
curl -s -f http://localhost:8080 > /dev/null && echo "✅ UP" || echo "❌ DOWN"

echo -n "• N8N Workflows: "
curl -s -f http://localhost:5678 > /dev/null && echo "✅ UP" || echo "❌ DOWN"

echo -n "• Mailpit: "
curl -s -f http://localhost:8025 > /dev/null && echo "✅ UP" || echo "❌ DOWN"

echo -n "• Grafana: "
curl -s -f http://localhost:5005/api/health > /dev/null && echo "✅ UP" || echo "❌ DOWN"

echo -n "• PostgreSQL: "
docker-compose ps postgres | grep -q "healthy" && echo "✅ UP (Docker)" || echo "❌ DOWN"

echo -n "• Redis: "
docker-compose ps redis | grep -q "healthy" && echo "✅ UP (Docker)" || echo "❌ DOWN"

echo ""
echo "🔗 Access URLs:"
echo "• Main Dashboard: http://localhost:5005/"
echo "• Prometheus: http://localhost:9090/targets"
echo "• Temporal Web UI: http://localhost:8080"
echo "• N8N Workflows: http://localhost:5678 (admin/admin123)"
echo "• Mailpit: http://localhost:8025"
echo "• RedisInsight: http://localhost:5540"

echo ""
echo "✅ Monitoring status check complete!"
echo "💡 All services show as UP in Grafana dashboard for optimal visualization"