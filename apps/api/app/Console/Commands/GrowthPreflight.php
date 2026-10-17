<?php

namespace App\Console\Commands;

use App\Services\GrowthGate;
use Illuminate\Console\Command;

class GrowthPreflight extends Command
{
    protected $signature = 'flamboyan:growth-preflight';

    protected $description = 'Validate growth and isolated preview configuration without connecting or mutating data';

    public function handle(): int
    {
        $preview = (bool) config('growth.preview_isolated');
        $schema = (string) config('database.connections.pgsql.search_path');
        $media = (string) config('filesystems.disks.media.root');
        if ($preview) {
            $valid = config('database.default') === 'pgsql'
                && str_starts_with($schema, 'growth_preview_')
                && config('filesystems.disks.media.driver') === 's3'
                && str_starts_with($media, 'growth-preview/');
            if (! $valid) {
                $this->error('Isolated preview requires pgsql growth_preview_* schema and private S3 growth-preview/* media root.');

                return self::FAILURE;
            }
        }
        $growthReady = app(GrowthGate::class)->configured();
        $this->line('preview_isolation='.($preview ? 'enabled' : 'disabled'));
        $this->line('database_schema='.$schema);
        $this->line('media_prefix='.($media === '' ? '(default)' : $media));
        $this->line('public_inquiry_gate='.($growthReady ? 'configured' : 'disabled'));

        return self::SUCCESS;
    }
}
