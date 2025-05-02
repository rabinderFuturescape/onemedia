FROM quay.io/keycloak/keycloak:23.0.3 as builder

# Enable health and metrics support
ENV KC_HEALTH_ENABLED=true \
    KC_METRICS_ENABLED=true \
    KC_DB=postgres

WORKDIR /opt/keycloak
# For demonstration purposes only, please make sure to use proper certificates in production instead
RUN keytool -genkeypair -storepass password -storetype PKCS12 -keyalg RSA -keysize 2048 -dname "CN=server" -alias server -ext "SAN:c=DNS:localhost,IP:127.0.0.1" -keystore conf/server.keystore && \
    /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:23.0.3
COPY --from=builder /opt/keycloak/ /opt/keycloak/

# Copy custom themes if needed
COPY docker/services/keycloak/themes/ /opt/keycloak/themes/

# Copy custom providers if needed
COPY docker/services/keycloak/providers/ /opt/keycloak/providers/

# Copy custom configuration if needed
COPY docker/services/keycloak/conf/ /opt/keycloak/conf/

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/health/ready || exit 1

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start-dev"]
