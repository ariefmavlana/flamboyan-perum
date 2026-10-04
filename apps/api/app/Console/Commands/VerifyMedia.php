<?php

namespace App\Console\Commands;

use App\Models\PropertyMedia;
use App\Support\MediaDisk;
use Illuminate\Console\Command;

/**
 * Read-only integrity check for private media.
 *
 * The storage layout keeps one directory per processed media record and one
 * staging file per pending upload. Nothing else verifies that those objects are
 * still reachable, so a missing variant only surfaces as a 404 in the gallery.
 * This command reports the gap without changing any state.
 */
class VerifyMedia extends Command
{
    protected $signature = 'flamboyan:media-verify {--json : Output machine-readable JSON}';

    protected $description = 'Report media records whose stored files are missing (read-only).';

    public function handle(): int
    {
        $disk = MediaDisk::disk();
        $missing = [];
        $checked = 0;

        PropertyMedia::query()->orderBy('id')->chunkById(100, function ($items) use ($disk, &$missing, &$checked) {
            foreach ($items as $media) {
                // Purged media keep their variant paths in the record while the
                // objects are intentionally gone, so they are not a defect.
                if ($media->purged_at !== null) {
                    continue;
                }
                if ($media->staging_path && $media->state === 'PROCESSING' && ! $disk->exists($media->staging_path)) {
                    $missing[] = ['media_id' => $media->id, 'property_id' => $media->property_id, 'state' => $media->state, 'published' => (bool) $media->published, 'object' => $media->staging_path, 'variant' => 'staging'];
                }
                foreach ((array) $media->variants as $variant => $meta) {
                    $path = is_array($meta) ? ($meta['path'] ?? null) : null;
                    if (! is_string($path) || $path === '') {
                        continue;
                    }
                    $checked++;
                    if (! $disk->exists($path)) {
                        $missing[] = ['media_id' => $media->id, 'property_id' => $media->property_id, 'state' => $media->state, 'published' => (bool) $media->published, 'object' => $path, 'variant' => (string) $variant];
                    }
                }
            }
        });

        $published = array_filter($missing, fn (array $row) => $row['published']);

        if ($this->option('json')) {
            $this->line((string) json_encode(['checked_variants' => $checked, 'missing' => count($missing), 'missing_published' => count($published), 'rows' => $missing], JSON_THROW_ON_ERROR));
        } else {
            foreach ($missing as $row) {
                $this->warn(sprintf('media #%d (property #%d, %s%s): missing %s at %s', $row['media_id'], $row['property_id'], $row['state'], $row['published'] ? ', published' : '', $row['variant'], $row['object']));
            }
            $this->info('Checked variants: '.$checked);
            $this->info('Missing objects: '.count($missing).' (published: '.count($published).')');
        }

        return $missing === [] ? self::SUCCESS : self::FAILURE;
    }
}
