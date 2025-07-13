FROM php:8.2-fpm-alpine

# Install dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    git \
    curl \
    unzip \
    postgresql-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    libzip-dev \
    icu-dev \
    oniguruma-dev

# Configure and install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg && \
    docker-php-ext-install -j$(nproc) \
    gd \
    pdo_pgsql \
    pgsql \
    zip \
    intl \
    mbstring \
    opcache

# Download Kanboard
RUN curl -L https://github.com/kanboard/kanboard/archive/v1.2.35.tar.gz -o kanboard.tar.gz && \
    tar xzf kanboard.tar.gz && \
    mv kanboard-1.2.35 /var/www/app && \
    rm kanboard.tar.gz

# Create necessary directories
RUN mkdir -p /var/www/app/data /var/www/app/plugins /run/nginx

# Download and install Mattermost plugin
RUN curl -L https://github.com/kanboard/plugin-mattermost/releases/download/v1.0.4/Mattermost-1.0.4.zip -o /tmp/mattermost.zip && \
    unzip /tmp/mattermost.zip -d /var/www/app/plugins/ && \
    rm /tmp/mattermost.zip

# Set permissions
RUN chown -R www-data:www-data /var/www/app && \
    chmod -R 755 /var/www/app/data /var/www/app/plugins

# Configure nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Configure supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Set working directory
WORKDIR /var/www/app

# Expose port
EXPOSE 80

# Start services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]