FROM prom/prometheus:v2.48.1

# Copy Prometheus configuration
COPY docker/services/prometheus/prometheus.yml /etc/prometheus/prometheus.yml

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O- http://localhost:9090/-/healthy || exit 1

# Expose Prometheus port
EXPOSE 9090

# Set the command
CMD ["--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.path=/prometheus", "--web.console.libraries=/usr/share/prometheus/console_libraries", "--web.console.templates=/usr/share/prometheus/consoles"]
