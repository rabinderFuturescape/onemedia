FROM grafana/grafana:10.2.3

# Copy Grafana configuration
COPY docker/services/grafana/grafana.ini /etc/grafana/grafana.ini

# Copy datasources
COPY docker/services/grafana/provisioning/datasources /etc/grafana/provisioning/datasources

# Copy dashboards
COPY docker/services/grafana/provisioning/dashboards /etc/grafana/provisioning/dashboards

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O- http://localhost:3000/api/health || exit 1

# Expose Grafana port
EXPOSE 3000

# Set the command
CMD ["--config=/etc/grafana/grafana.ini"]
