<?php

namespace App\Console\Commands;

use App\Models\PropertyMedia;
use App\Support\MediaDisk;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanupMedia extends Command
{
    protected $signature = 'flamboyan:media-cleanup {--execute : Delete eligible private media after verified backup}';

    protected $description = 'Preview or purge archived private media after the 30-day grace period.';

    public function handle(): int
    {
        $count = 0;
        $disk = Storage::disk('media');
        PropertyMedia::query()->where('state', 'ARCHIVED')->where('archived_at', '<=', now()->subDays(30))->whereNull('purged_at')->chunkById(50, function ($items) use (&$count, $disk) {
            foreach ($items as $media) {
                $count++;
                if ($this->option('execute')) {
                    $paths = array_column($media->variants ?? [], 'path');
                    if ($media->staging_path) {
                        $paths[] = $media->staging_path;
                    }
                    $disk->delete($paths);
                    $media->update(['purged_at' => now()]);
                }
            }
        });
        $orphans = 0;
        if (! MediaDisk::isLocal()) {
            // Remote disks have no directory enumeration that maps to the local
            // staging/ready layout, so orphan scanning only runs on local disks.
            $this->info(($this->option('execute') ? 'Purged: ' : 'Eligible (dry run): ').$count);
            $this->info('Unreferenced files/directories past grace: 0 (remote disk: not scanned)');

            return self::SUCCESS;
        }
        foreach (['staging', 'ready'] as $prefix) {
            $root = $disk->path($prefix);
            if (! is_dir($root)) {
                continue;
            }
            foreach (new \DirectoryIterator($root) as $entry) {
                $name = $entry->getFilename();
                $pattern = $prefix === 'staging' ? '/^[a-f0-9-]{36}\.bin$/' : '/^[a-f0-9-]{36}$/';
                if ($entry->isDot() || $entry->isLink() || ! preg_match($pattern, $name) || $entry->getMTime() > now()->subDays(30)->timestamp) {
                    continue;
                }
                $key = $prefix.'/'.$name;
                // JSON encodes "/" as "\/" by default, so matching the raw stored
                // text against "ready/<uuid>/" never matches and made the sweep
                // delete directories that are still in use. Match the decoded
                // variants in PHP instead of the raw JSON string.
                $referenced = $prefix === 'staging'
                    ? PropertyMedia::query()->where('staging_path', $key)->exists()
                    : $this->referencedReadyKey($key);
                if ($referenced) {
                    continue;
                }
                $orphans++;
                if ($this->option('execute')) {
                    if ($prefix === 'staging' && $entry->isFile()) {
                        $disk->delete($key);
                    } elseif ($prefix === 'ready' && $entry->isDir()) {
                        $disk->deleteDirectory($key);
                    }
                }
            }
        }
        $this->info(($this->option('execute') ? 'Purged: ' : 'Eligible (dry run): ').$count);
        $this->info('Unreferenced files/directories past grace: '.$orphans);
        if (! $this->option('execute')) {
            $this->line('Verify consistent encrypted DB/media backup before using --execute. Audit records remain intact.');
        }

        return self::SUCCESS;
    }

    /**
     * A ready directory stays as long as any stored variant path points into it.
     */
    private function referencedReadyKey(string $key): bool
    {
        return PropertyMedia::query()
            ->whereNotNull('variants')
            ->pluck('variants')
            ->contains(function ($variants) use ($key) {
                $paths = is_array($variants) ? $variants : json_decode((string) $variants, true);

                foreach ((array) $paths as $variant) {
                    if (is_array($variant) && str_starts_with((string) ($variant['path'] ?? ''), $key.'/')) {
                        return true;
                    }
                }

                return false;
            });
    }
}
