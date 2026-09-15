# MatriConnect Backend

Laravel 12 API for the MatriConnect matrimony platform demo.

See the [root README](../README.md) for setup instructions.

## API Documentation

Swagger docs available at `/api/documentation` when running locally.

## Key Commands

```bash
php artisan migrate --seed    # Run migrations + seed demo data
php artisan reverb:start      # Start WebSocket server
php artisan queue:work        # Process background jobs
php artisan test              # Run PHPUnit tests
```
