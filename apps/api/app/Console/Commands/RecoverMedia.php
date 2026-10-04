<?php

namespace App\Console\Commands;

use App\Jobs\ProcessPropertyMedia;
use App\Models\PropertyMedia;
use Illuminate\Console\Command;

class RecoverMedia extends Command
{
    protected $signature = 'flamboyan:media-recover {--execute : Requeue processing records older than 15 minutes}';

    protected $description = 'Preview or recover pending media after worker interruption.';

    public function handle(): int
    {
        if (config('queue.connections.database.connection') !== null && config('queue.connections.database.connection') !== config('database.default')) {
            $this->error('Media queue must use the application database.');

            return self::FAILURE;
        }
        $count = 0;
        PropertyMedia::query()->where('state', 'PROCESSING')->where('updated_at', '<=', now()->subMinutes(15))->chunkById(50, function ($items) use (&$count) {
            foreach ($items as $media) {
                $count++;
                if ($this->option('execute')) {
                    ProcessPropertyMedia::dispatch($media->id)->onConnection('database')->onQueue(config('media.queue'));
                }
            }
        });
        $this->info(($this->option('execute') ? 'Requeue candidates: ' : 'Eligible (dry run): ').$count);

        return self::SUCCESS;
    }
}
