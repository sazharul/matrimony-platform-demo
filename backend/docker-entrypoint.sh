#!/bin/sh
set -e

if [ ! -f .env ]; then
    cp .env.example .env
fi

php artisan key:generate --force --no-interaction 2>/dev/null || true
php artisan migrate --force --no-interaction
php artisan db:seed --force --no-interaction
php artisan storage:link --force 2>/dev/null || true

exec php artisan serve --host=0.0.0.0 --port=8000
