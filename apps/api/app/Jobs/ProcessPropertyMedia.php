<?php

namespace App\Jobs;

use App\Models\PropertyMedia;
use App\Services\MediaProcessor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessPropertyMedia implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    public bool $failOnTimeout = true;

    public function __construct(public int $mediaId) {}

    public function backoff(): array
    {
        return [10, 30, 60];
    }

    public function handle(MediaProcessor $processor): void
    {
        $processor->process($this->mediaId);
    }

    public function failed(?\Throwable $exception): void
    {
        PropertyMedia::query()->whereKey($this->mediaId)->where('state', 'PROCESSING')->update(['state' => 'FAILED', 'failure_code' => 'PROCESSING_ERROR', 'updated_at' => now()]);
    }
}
