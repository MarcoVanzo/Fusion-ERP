# ═══════════════════════════════════════════════════════════════════
# Fusion ERP — Production Dockerfile
# Multi-stage build: PHP 8.1-FPM + Nginx
# ═══════════════════════════════════════════════════════════════════

FROM php:8.1-fpm-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    zip unzip \
    icu-dev \
    oniguruma-dev \
    libzip-dev \
    mariadb-client

# Install PHP extensions
RUN docker-php-ext-install \
    pdo_mysql \
    mbstring \
    intl \
    zip \
    opcache

# Configure OPcache for production
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.memory_consumption=256" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.max_accelerated_files=10000" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.validate_timestamps=0" >> /usr/local/etc/php/conf.d/opcache.ini

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# ─── Dependencies layer (cached) ────────────────────────────────
FROM base AS deps

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts

# ─── Application layer ──────────────────────────────────────────
FROM base AS app

# Copy installed dependencies
COPY --from=deps /var/www/html/vendor ./vendor

# Copy application code
COPY api/ ./api/
COPY css/ ./css/
COPY js/ ./js/
COPY db/ ./db/
COPY templates/ ./templates/
COPY legal/ ./legal/
COPY mobile/ ./mobile/
COPY index.html .
# NOTE: .htaccess is NOT copied — Nginx config replaces Apache rules

# Nginx config
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Supervisor config (manages nginx + php-fpm)
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create required directories
RUN mkdir -p /var/www/html/uploads \
    /var/www/html/sessions \
    /var/www/html/logs \
    /var/www/html/storage \
    && chown -R www-data:www-data /var/www/html

# PHP config
RUN echo "upload_max_filesize=50M" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "post_max_size=50M" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "memory_limit=256M" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "max_execution_time=120" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "session.gc_maxlifetime=2592000" >> /usr/local/etc/php/conf.d/custom.ini

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost/api/?module=health&action=ping || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
