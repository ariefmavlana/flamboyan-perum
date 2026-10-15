<?php

namespace App\Console\Commands;

use App\Models\PropertyMedia;
use App\Models\SiteContent;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanupMedia extends Command
{
    protected $signature = 'flamboyan:media-cleanup {--execute : Delete eligible private media after verified backup} {--json : Output the object and byte report as JSON}';

    protected $description = 'Preview or purge archived and unreferenced private media after the 30-day grace period.';

    public function handle(): int
    {
        $execute = (bool) $this->option('execute');
        $cutoff = now()->subDays(30);
        $disk = Storage::disk('media');
        $objects = [];
        foreach (['staging', 'ready', 'content-logos'] as $prefix) {
            foreach ($disk->getDriver()->listContents($prefix, true) as $entry) {
                if ($entry->isFile() && $this->managedPath($entry->path())) {
                    $objects[$entry->path()] = ['size_bytes' => $entry->fileSize() ?? $disk->size($entry->path()), 'last_modified' => $entry->lastModified()];
                }
            }
        }

        $report = ['mode' => $execute ? 'execute' : 'dry_run', 'grace_days' => 30, 'eligible_archived_media' => 0, 'purged_media' => 0, 'eligible_objects' => 0, 'eligible_bytes' => 0, 'eligible_orphan_objects' => 0, 'eligible_orphan_bytes' => 0, 'deleted_objects' => 0, 'deleted_bytes' => 0, 'retained_shared_objects' => 0, 'blocked_media_ids' => [], 'rows' => []];
        $rows = [];
        $shared = [];
        $retiredIds = [];
        PropertyMedia::query()->where('state', 'ARCHIVED')->where('archived_at', '<=', $cutoff)->whereNull('purged_at')->chunkById(50, function ($items) use ($execute, $disk, $objects, &$report, &$rows, &$shared, &$retiredIds) {
            foreach ($items as $media) {
                $report['eligible_archived_media']++;
                $paths = $this->mediaPaths($media);
                if (array_filter($paths, fn ($path) => ! $this->managedPath($path)) !== []) {
                    $report['blocked_media_ids'][] = $media->id;

                    continue;
                }

                // Treat earlier dry-run candidates as retired too, so shared
                // archived objects produce the same plan as an executed run.
                $references = $this->referencedPaths([...$retiredIds, $media->id]);
                foreach ($paths as $path) {
                    if (isset($references[$path])) {
                        $shared[$path] = true;

                        continue;
                    }
                    if (! isset($objects[$path]) || isset($rows[$path])) {
                        continue;
                    }
                    $rows[$path] = ['path' => $path, 'size_bytes' => $objects[$path]['size_bytes'], 'source' => 'ARCHIVED', 'media_id' => $media->id];
                    if ($execute) {
                        if (! $disk->delete($path)) {
                            throw new \RuntimeException('Media deletion failed: '.$path);
                        }
                        $report['deleted_objects']++;
                        $report['deleted_bytes'] += $objects[$path]['size_bytes'];
                    }
                }
                if ($execute) {
                    $media->update(['purged_at' => now()]);
                    $report['purged_media']++;
                }
                $retiredIds[] = $media->id;
            }
        });

        $references = $this->referencedPaths($retiredIds);
        foreach ($objects as $path => $object) {
            if (isset($rows[$path]) || isset($references[$path]) || $object['last_modified'] === null || $object['last_modified'] > $cutoff->timestamp) {
                continue;
            }
            if ($execute) {
                // CLI execution must run with media writes paused. Refresh both
                // references and object age immediately before each orphan delete.
                if (isset($this->referencedPaths()[$path]) || $disk->lastModified($path) > $cutoff->timestamp) {
                    continue;
                }
                if (! $disk->delete($path)) {
                    throw new \RuntimeException('Media deletion failed: '.$path);
                }
                $report['deleted_objects']++;
                $report['deleted_bytes'] += $object['size_bytes'];
            }
            $rows[$path] = ['path' => $path, 'size_bytes' => $object['size_bytes'], 'source' => 'ORPHAN', 'media_id' => null];
            $report['eligible_orphan_objects']++;
            $report['eligible_orphan_bytes'] += $object['size_bytes'];
        }

        $report['rows'] = array_values($rows);
        $report['eligible_objects'] = count($rows);
        $report['eligible_bytes'] = array_sum(array_column($rows, 'size_bytes'));
        $report['retained_shared_objects'] = count(array_diff_key($shared, $rows));
        if ($this->option('json')) {
            $this->line(json_encode($report, JSON_THROW_ON_ERROR));
        } else {
            $this->info(($execute ? 'Purged: ' : 'Eligible archived media (dry run): ').($execute ? $report['purged_media'] : $report['eligible_archived_media']));
            $this->info('Eligible objects: '.$report['eligible_objects'].' ('.$report['eligible_bytes'].' bytes)');
            $this->info('Unreferenced objects past grace: '.$report['eligible_orphan_objects'].' ('.$report['eligible_orphan_bytes'].' bytes)');
            $this->info('Retained shared objects: '.$report['retained_shared_objects']);
            if ($report['blocked_media_ids'] !== []) {
                $this->warn('Archived media with unsupported paths retained: '.implode(', ', $report['blocked_media_ids']));
            }
            if (! $execute) {
                $this->line('Verify consistent encrypted DB/media backup and pause media writes before using --execute. Audit records remain intact.');
            }
        }

        return self::SUCCESS;
    }

    private function mediaPaths(PropertyMedia $media): array
    {
        $paths = array_column($media->variants ?? [], 'path');
        if ($media->staging_path) {
            $paths[] = $media->staging_path;
        }

        return array_unique($paths);
    }

    private function referencedPaths(array $retiredIds = []): array
    {
        $paths = [];
        PropertyMedia::query()->whereNull('purged_at')->whereNotIn('id', $retiredIds)->select(['id', 'variants', 'staging_path'])->chunkById(100, function ($items) use (&$paths) {
            foreach ($items as $media) {
                foreach ($this->mediaPaths($media) as $path) {
                    $paths[$path] = true;
                }
            }
        });
        SiteContent::query()->select(['id', 'payload'])->chunkById(100, function ($items) use (&$paths) {
            foreach ($items as $content) {
                if (isset($content->payload['_logo']['path'])) {
                    $paths[$content->payload['_logo']['path']] = true;
                }
            }
        });

        return $paths;
    }

    private function managedPath(string $path): bool
    {
        $uuid = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';

        return preg_match('~\A(?:staging/'.$uuid.'\.bin|ready/'.$uuid.'/(?:640\.webp|1280\.webp|1920\.webp|brochure\.pdf)|content-logos/'.$uuid.'\.webp)\z~', $path) === 1;
    }
}
